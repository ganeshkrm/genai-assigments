import fs from "fs/promises";
import { IngestionErrors } from "../../../middleware/errorHandler";
import { env } from "../../../config/env";
import { cleanText } from "../utils/textCleaner";
import { ResumeParserService } from "./ResumeParserService";
import { EmbeddingService } from "./EmbeddingService";
import { createResumeParser } from "./ResumeParserFactory";
import {
  ResumeIngestionRepository,
  buildResumeDocument,
} from "../repositories/ResumeIngestionRepository";

export interface IngestionTimings {
  extractMs: number;
  cleanMs: number;
  parseMs: number;
  embeddingMs: number;
  mongoInsertMs: number;
  totalMs: number;
}

export interface IngestionResult {
  resumeId: string;
  data: {
    name: string | null;
    role: string | null;
    company: string | null;
    totalExperience: number | null;
    skillsCount: number;
    embeddingModel: string;
    embeddingDimension: number;
  };
  timings: IngestionTimings;
}

/**
 * Orchestrates the full ingestion pipeline (Phase 13):
 *
 *   Validate PDF -> Extract -> Clean -> Parse (algorithm/LLM) ->
 *   Skills + Metadata -> Mistral Embedding -> Store in MongoDB ->
 *   Return resumeId + parsed summary + timings.
 *
 * Each failure stage maps to its stable error code from the Phase-14 table.
 */
export class ResumeIngestionService {
  private readonly parserService = new ResumeParserService();
  private readonly embeddingService = new EmbeddingService();
  private readonly repository = new ResumeIngestionRepository();

  /**
   * HTTP entrypoint: extract text from an uploaded PDF, then run the pipeline.
   * Always removes the uploaded temp file afterwards.
   */
  async injectResume(file: Express.Multer.File): Promise<IngestionResult> {
    try {
      const extractStart = Date.now();
      let rawText: string;
      try {
        rawText = await this.parserService.extractTextFromPdf(file.path);
      } catch {
        throw IngestionErrors.extractionFailed();
      }
      if (!rawText || rawText.trim().length === 0) {
        throw IngestionErrors.extractionFailed();
      }
      const extractMs = Date.now() - extractStart;

      return await this.runPipeline(file.originalname, rawText, extractMs);
    } finally {
      // Always clean up the uploaded temp file.
      await fs.unlink(file.path).catch(() => {
        /* best-effort cleanup */
      });
    }
  }

  /**
   * Batch/CLI entrypoint (Phase 17): run the pipeline on already-extracted text
   * (e.g. from a .doc/.docx/.pdf extracted by the batch job). Does NOT touch
   * the source file — the caller owns it.
   */
  async ingestFromText(
    fileName: string,
    rawText: string
  ): Promise<IngestionResult> {
    if (!rawText || rawText.trim().length === 0) {
      throw IngestionErrors.extractionFailed();
    }
    return this.runPipeline(fileName, rawText, 0);
  }

  /**
   * Shared pipeline: clean -> parse -> Mistral embed -> store. Reused by both
   * the HTTP and batch entrypoints. `extractMs` is the time already spent
   * extracting text before this step.
   */
  private async runPipeline(
    fileName: string,
    rawText: string,
    extractMs: number
  ): Promise<IngestionResult> {
    const start = Date.now();
    const timings: IngestionTimings = {
      extractMs,
      cleanMs: 0,
      parseMs: 0,
      embeddingMs: 0,
      mongoInsertMs: 0,
      totalMs: 0,
    };

    // 1. Clean text.
    let t = Date.now();
    const cleaned = cleanText(rawText);
    timings.cleanMs = Date.now() - t;

    // 2. Parse (algorithm or LLM, per USE_LLM_PARSER).
    t = Date.now();
    let resume;
    try {
      resume = await createResumeParser().parse(cleaned);
    } catch {
      throw IngestionErrors.parseFailed();
    }
    timings.parseMs = Date.now() - t;

    // 3. Generate Mistral embedding.
    t = Date.now();
    let embedding: number[];
    try {
      const embeddingText = this.embeddingService.buildEmbeddingInput({
        name: resume.name,
        role: resume.role,
        skills: resume.skills,
        company: resume.company,
        experienceSummary: resume.experienceSummary,
        rawText: cleaned,
      });
      embedding = await this.embeddingService.generateEmbedding(embeddingText);
    } catch {
      throw IngestionErrors.embeddingFailed();
    }
    if (embedding.length !== env.EMBEDDING_DIMENSION) {
      throw IngestionErrors.embeddingFailed();
    }
    timings.embeddingMs = Date.now() - t;

    // 4. Store in MongoDB.
    t = Date.now();
    let resumeId: string;
    try {
      const doc = buildResumeDocument({
        fileName,
        resume,
        rawText: cleaned,
        embedding,
      });
      resumeId = await this.repository.insertResume(doc);
    } catch {
      throw IngestionErrors.ingestionFailed();
    }
    timings.mongoInsertMs = Date.now() - t;

    timings.totalMs = Date.now() - start;

    return {
      resumeId,
      data: {
        name: resume.name ?? null,
        role: resume.role ?? null,
        company: resume.company ?? null,
        totalExperience: resume.totalExperience ?? null,
        skillsCount: resume.skills.length,
        embeddingModel: env.MISTRAL_EMBED_MODEL,
        embeddingDimension: embedding.length,
      },
      timings,
    };
  }
}
