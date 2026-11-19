/**
 * Phase 17 — Bulk Resume Ingestion (CLI batch job).
 *
 * Ingests resume files (.pdf/.doc/.docx) from a folder through the EXISTING
 * pipeline, processing up to BATCH_SIZE un-ingested files per run. Idempotent:
 * already-ingested fileNames are skipped, so repeated runs walk the folder.
 *
 * Written in TypeScript and run via ts-node so it reuses the real pipeline
 * services (no duplicated clean/parse/embed/store logic).
 *
 * Usage:
 *   npm run ingest:batch                 (batch size 10, default folder)
 *   npm run ingest:batch -- --batch=5
 *   npm run ingest:batch -- --batch=10 --dir="D:\\path\\to\\Resumes"
 */
import fs from "fs";
import path from "path";
import WordExtractor from "word-extractor";
import {
  connectToDatabase,
  closeDatabase,
  getResumesCollection,
} from "../src/config/database";
import { ResumeIngestionService } from "../src/modules/ingestion/services/ResumeIngestionService";
import { ResumeParserService } from "../src/modules/ingestion/services/ResumeParserService";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const DEFAULT_DIR = "D:\\GenAI\\phase2\\week9\\Resumes";

function parseArgs(): { batch: number; dir: string; delayMs: number } {
  let batch = parseInt(process.env.BATCH_SIZE || "10", 10);
  let dir = process.env.RESUMES_DIR || DEFAULT_DIR;
  let delayMs = parseInt(process.env.INGEST_DELAY_MS || "300", 10);

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--batch=")) batch = parseInt(arg.split("=")[1], 10);
    else if (arg.startsWith("--dir=")) dir = arg.split("=").slice(1).join("=");
    else if (arg.startsWith("--delay=")) delayMs = parseInt(arg.split("=")[1], 10);
  }
  if (!Number.isFinite(batch) || batch <= 0) batch = 10;
  if (!Number.isFinite(delayMs) || delayMs < 0) delayMs = 300;
  return { batch, dir, delayMs };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const wordExtractor = new WordExtractor();
const parserService = new ResumeParserService();

/** Minimal HTML-to-text (for .doc files that are actually HTML exports). */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")
    .trim();
}

/** Minimal RTF-to-text (for .doc files that are actually RTF exports). */
function rtfToText(rtf: string): string {
  return rtf
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\[a-z]+-?\d* ?/gi, " ")
    .replace(/[{}]/g, " ")
    .trim();
}

/**
 * Route text extraction by file extension, sniffing content for .doc files
 * (many ".doc" exports are actually HTML or RTF, not real OLE Word docs).
 */
async function extractText(filePath: string, ext: string): Promise<string> {
  if (ext === ".pdf") {
    return parserService.extractTextFromPdf(filePath);
  }

  if (ext === ".doc") {
    const buf = fs.readFileSync(filePath);
    const headHex = buf.subarray(0, 4).toString("hex");
    const headAscii = buf.subarray(0, 64).toString("latin1").trimStart();
    if (headHex !== "d0cf11e0") {
      // Not a real OLE Word document — detect common mislabeled formats.
      if (/^<!doctype html|^<html/i.test(headAscii)) {
        return htmlToText(buf.toString("utf8"));
      }
      if (headAscii.startsWith("{\\rtf")) {
        return rtfToText(buf.toString("latin1"));
      }
    }
  }

  // Real .doc (OLE) or .docx
  const doc = await wordExtractor.extract(filePath);
  return (doc.getBody() || "").trim();
}

async function main(): Promise<void> {
  const { batch, dir, delayMs } = parseArgs();

  if (!fs.existsSync(dir)) {
    console.error(`Source folder not found: ${dir}`);
    process.exit(1);
  }

  await connectToDatabase();
  const collection = getResumesCollection();
  const service = new ResumeIngestionService();

  // Discover files and split by support.
  const allFiles = fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isFile());
  const supported = allFiles.filter((f) =>
    ALLOWED_EXTENSIONS.has(path.extname(f).toLowerCase())
  );
  const unsupported = allFiles.filter(
    (f) => !ALLOWED_EXTENSIONS.has(path.extname(f).toLowerCase())
  );

  // Idempotency: skip files already ingested (dedup by fileName).
  const existingDocs = await collection
    .find({}, { projection: { fileName: 1 } })
    .toArray();
  const existing = new Set(existingDocs.map((d) => d.fileName));
  const pending = supported.filter((f) => !existing.has(f));
  const thisRun = pending.slice(0, batch);

  console.log(`\n=== Bulk ingestion run ===`);
  console.log(`folder: ${dir}`);
  console.log(
    `files: ${allFiles.length} total | ${supported.length} supported | ${unsupported.length} unsupported`
  );
  console.log(
    `already ingested: ${existing.size} | pending: ${pending.length} | this run: ${thisRun.length} (batch=${batch})\n`
  );

  let ingested = 0;
  let failed = 0;

  for (let i = 0; i < thisRun.length; i++) {
    const file = thisRun[i];
    if (i > 0 && delayMs > 0) await sleep(delayMs);
    const filePath = path.join(dir, file);
    const ext = path.extname(file).toLowerCase();
    const t0 = Date.now();
    try {
      const text = await extractText(filePath, ext);
      const result = await service.ingestFromText(file, text);
      ingested++;
      console.log(
        `  [OK]   ${file} -> ${result.resumeId} ` +
          `(name:"${result.data.name ?? "-"}", skills:${result.data.skillsCount}, ` +
          `dim:${result.data.embeddingDimension}, ${Date.now() - t0}ms)`
      );
    } catch (err) {
      failed++;
      const e = err as { errorCode?: string; message?: string };
      console.log(`  [FAIL] ${file} -> ${e.errorCode || "ERROR"}: ${e.message}`);
    }
  }

  const remaining = pending.length - thisRun.length;
  console.log(`\n=== Summary ===`);
  console.log(`ingested:              ${ingested}`);
  console.log(`failed:                ${failed}`);
  console.log(`skipped UNSUPPORTED:   ${unsupported.length}`);
  console.log(`skipped ALREADY:       ${existing.size}`);
  console.log(`remaining un-ingested: ${remaining}`);
  console.log(
    remaining > 0
      ? `Run again to process the next ${Math.min(batch, remaining)}.`
      : `All supported files ingested.`
  );

  await closeDatabase();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Batch run failed:", (err as Error).message);
  try {
    await closeDatabase();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
