# Phase 17 — Bulk Resume Ingestion

> **Reference spec.** This document is the implementation reference for the batch
> (bulk) resume ingestion feature. It extends the existing ingestion backend; it
> does **not** introduce a second backend, a second database, or a new HTTP
> server. Implement strictly against this file.

---

## 1. Purpose

Ingest many resume files from a folder through the **existing** ingestion
pipeline, processing a **configurable number of files per run (default 10,
switchable to 5)**, idempotently, with per-file error isolation and a run
summary. Repeated runs walk the whole folder batch by batch.

---

## 2. Context & Constraints

- Node + TypeScript + Express backend at `D:\GenAI\phase2\week9\resume_ingestion`.
- The pipeline already exists and is tested: `ResumeIngestionService.injectResume(file)`
  performs **extract → clean → parse → Mistral embed (1024) → store** in MongoDB
  collection `resumes`.
- Shared Mongo connection: `src/config/database.ts` (`connectToDatabase`,
  `getResumesCollection`).
- Existing operational script pattern: `scripts/clearResumes.js` + the
  `clean:resumes` npm script.
- **Reuse** `connectToDatabase`, `getResumesCollection`, and the pipeline
  (clean/parse/embed/store). Do **not** duplicate pipeline logic.
- Honor `.env` (`USE_LLM_PARSER`, `MISTRAL_API_KEY`, `MONGODB_URI`, …). Baseline
  `USE_LLM_PARSER=false`.
- No change to existing HTTP endpoints, the architecture pipeline, or the tests.

---

## 3. Supported File Types

Allowed and ingested: **`.pdf`, `.doc`, `.docx`**.

Anything else is skipped and reported (`UNSUPPORTED_TYPE`).

### Text extraction strategy (route by extension)
| Type | Extractor |
|---|---|
| `.pdf` | Existing `ResumeParserService.extractTextFromPdf(filePath)` (pdf-parse). |
| `.docx` | `.doc`/`.docx` text extractor (see Dependencies). |
| `.doc` | Same `.doc`/`.docx` extractor (OLE binary Word 97–2003). |

After extraction, **all types feed the same** clean → parse → embed → store steps.
If extracted text is empty/whitespace, treat as `RESUME_EXTRACTION_FAILED` for that
file (skip it, continue the batch).

---

## 4. Source Folder

- Default: `D:\GenAI\phase2\week9\Resumes` (overridable via `--dir=` arg or
  `RESUMES_DIR` env).
- Inventory snapshot at authoring time: **199 files** — 180 `.pdf`, 18 `.docx`,
  1 `.doc`. ~35 filenames carry `(1)`/`(2)` copy suffixes.

---

## 5. Dependencies to Add

- A Node library that extracts text from **both `.doc` and `.docx`**. Recommended:
  **`word-extractor`** (pure Node, no external binary; handles `.doc` and `.docx`
  via `new WordExtractor().extract(path).then(doc => doc.getBody())`).
  - Alternative for `.docx` only: `mammoth`. If used, a separate `.doc` solution
    is still required — prefer `word-extractor` to cover both in one dependency.
- Install as a runtime dependency. No other new dependencies.

---

## 6. Deliverables

Keep the surface minimal:

1. **`scripts/ingestBatch.js`** — Node CLI script (plain JS, like
   `scripts/clearResumes.js`).
2. **`package.json`** script: `"ingest:batch": "node scripts/ingestBatch.js"`
   (usage: `npm run ingest:batch -- --batch=5`).
3. **A pipeline entry that accepts already-extracted text**, to avoid duplicating
   clean/parse/embed/store. Recommended: refactor `ResumeIngestionService` so the
   shared steps live in a private `runPipeline(fileName, rawText)` used by both:
   - the existing `injectResume(file)` (after PDF extraction), and
   - a new `ingestFromText(fileName, rawText)` used by the batch script.
   The batch script performs type-routed extraction, then calls
   `ingestFromText(...)`. (This keeps the HTTP `/inject` PDF path unchanged.)

No new HTTP endpoint.

---

## 7. Functional Requirements

1. **Discover** files in the source folder; keep only `.pdf/.doc/.docx`
   (case-insensitive). Log + skip others as `UNSUPPORTED_TYPE`.
2. **Idempotency / resume:** query `resumes` for already-ingested `fileName`s and
   skip them (`ALREADY_INGESTED`). Each run therefore processes the **next**
   un-ingested batch, so repeated runs cover the whole folder.
3. **Batch size:** take the next **`BATCH_SIZE`** un-ingested files. Default `10`;
   override with `--batch=5` / `--batch=10` or `BATCH_SIZE` env. Must support both
   5 and 10.
4. **Per-file isolation:** wrap each file in try/catch — one failure must **never**
   abort the batch. Record `{ file, status, resumeId?, errorCode?, skillsCount?,
   embeddingDimension?, ms? }`.
5. **Dedup key:** `fileName`. (The `(1)`/`(2)` copies are distinct filenames and
   will each ingest; collapsing exact-content duplicates via hash is an optional
   future enhancement, out of scope here.)
6. **Reporting:** print a per-file line and a **run summary** with counts:
   `ingested / skipped(ALREADY_INGESTED) / skipped(UNSUPPORTED_TYPE) /
   failed`, total time, and the **remaining un-ingested count**.
7. **Exit code:** `0` if no hard failures; `1` if any file failed.
8. **Secrets/vectors** are never printed (no embedding arrays, no keys) — summary
   fields only (dimension, counts).

---

## 8. Non-Goals

- No vector index / retrieval (that is the next document).
- No new HTTP endpoint; no second backend/DB.
- No content-hash dedup (filename dedup only).
- No OCR for image-only/scanned files — such a file yields empty text and is
  reported as a failed/skipped extraction.

---

## 9. Finalized Defaults (decisions)

- **Allowed types:** `.pdf`, `.doc`, `.docx`.
- **Default batch size:** `10`, override `--batch=5`.
- **Dedup:** by `fileName`.
- **Non-matching text extraction (empty):** reported per-file, batch continues.

---

## 10. Validation Plan

1. `npm run clean:resumes` — start from an empty `resumes` collection.
2. `npm run ingest:batch -- --batch=5` → expect **5 ingested**, summary correct.
3. Repeat `npm run ingest:batch -- --batch=5` → **next 5** (first 5 not re-ingested).
4. `npm run ingest:batch -- --batch=10` → **10 more**.
5. Include at least one `.docx` and the one `.doc` across these batches; confirm
   they ingest (name/skills populated, `embeddingDimension: 1024`).
6. In MongoDB, verify: doc count == files processed, every doc has
   `embeddingDimension: 1024` and a `skills` array, and no duplicate `fileName`.
7. Confirm a corrupt/empty file is reported `failed`/skipped **without** aborting
   the batch.

---

## 11b. Implementation Notes (as built)

- **Language/runner:** `scripts/ingestBatch.ts` (TypeScript) run via
  `ts-node --transpile-only` — chosen over plain JS so it imports and reuses the
  real pipeline services (`ResumeIngestionService.ingestFromText`,
  `ResumeParserService`) with zero duplicated logic.
- **Service refactor:** `ResumeIngestionService` now has a private
  `runPipeline(fileName, rawText, extractMs)` shared by `injectResume(file)`
  (HTTP/PDF) and the new `ingestFromText(fileName, rawText)` (batch). The HTTP
  `/inject` PDF path is unchanged.
- **`.doc` is content-sniffed:** many “.doc” files are actually HTML or RTF
  exports (e.g. the one `.doc` here is HTML). The extractor checks the bytes:
  real OLE `.doc`/`.docx` → `word-extractor`; HTML → tag-strip; RTF → control-word
  strip. This made the one real-world `.doc` ingest successfully.
- **Embedding resilience:** `EmbeddingService.generateEmbedding` retries transient
  failures (HTTP 429 / 5xx / network) with exponential backoff (honoring
  `Retry-After`), `EMBED_MAX_ATTEMPTS` (default 4). Non-transient errors fail fast.
  This fixed intermittent `EMBEDDING_FAILED`s seen under bulk load.
- **Throttle:** batch sleeps `--delay=<ms>` (default 300) between files.

## 12. Acceptance Criteria

- `npm run ingest:batch` ingests up to `BATCH_SIZE` un-ingested `.pdf/.doc/.docx`
  files per run, reusing the existing pipeline.
- Re-running continues with the next batch (no re-ingestion of prior files).
- `.doc` and `.docx` files ingest successfully alongside `.pdf`.
- One bad file never aborts a batch; the run summary and exit code reflect reality.
- `npx tsc --noEmit` clean; existing endpoints and tests unaffected.
