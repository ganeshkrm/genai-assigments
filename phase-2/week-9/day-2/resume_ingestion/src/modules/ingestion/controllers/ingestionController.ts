import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { IngestionErrors } from "../../../middleware/errorHandler";
import { ResumeParserService } from "../services/ResumeParserService";
import { AlgorithmResumeParser } from "../services/AlgorithmResumeParser";
import { LLMResumeParser } from "../services/LLMResumeParser";
import { EmbeddingService } from "../services/EmbeddingService";
import { ResumeIngestionService } from "../services/ResumeIngestionService";
import {
  ResumeIngestionRepository,
  buildResumeDocument,
} from "../repositories/ResumeIngestionRepository";
import { cleanText } from "../utils/textCleaner";
import { detectSkills } from "../../../config/skills";
import { env } from "../../../config/env";

const resumeParserService = new ResumeParserService();
const algorithmResumeParser = new AlgorithmResumeParser();
const llmResumeParser = new LLMResumeParser();
const embeddingService = new EmbeddingService();
const resumeIngestionRepository = new ResumeIngestionRepository();
const resumeIngestionService = new ResumeIngestionService();

/**
 * Ingestion controller.
 *
 * Phase 3: temporary module readiness handler.
 * Phase 4: secure PDF upload handler.
 * Later phases add extract/parse/embed/store/inject handlers.
 */
export const ingestionController = {
  /**
   * GET /v1/resume/health — temporary module readiness check (Phase 3).
   */
  resumeHealth(_req: Request, res: Response): void {
    res.status(200).json({
      status: "ok",
      module: "resume-ingestion",
    });
  },

  /**
   * POST /v1/resume/upload — secure PDF upload (Phase 4).
   * The multer middleware has already validated type and size.
   */
  uploadResume(req: Request, res: Response, next: NextFunction): void {
    if (!req.file) {
      next(IngestionErrors.fileRequired());
      return;
    }

    const { originalname, mimetype, size, path: tempPath } = req.file;

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      file: {
        originalName: originalname,
        mimeType: mimetype,
        size,
      },
    });

    // Temporary file can be removed after processing (nothing else uses it
    // at this phase). Later phases hand the file to extraction first.
    fs.unlink(tempPath, () => {
      /* best-effort cleanup; ignore errors */
    });
  },

  /**
   * POST /v1/resume/extract — extract raw text from an uploaded PDF (Phase 5).
   */
  async extractResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.file) {
      next(IngestionErrors.fileRequired());
      return;
    }

    const tempPath = req.file.path;

    try {
      const rawText = await resumeParserService.extractTextFromPdf(tempPath);

      if (!rawText || rawText.length === 0) {
        next(IngestionErrors.extractionFailed());
        return;
      }

      res.status(200).json({
        success: true,
        rawText,
        characters: rawText.length,
      });
    } catch (_err) {
      next(IngestionErrors.extractionFailed());
    } finally {
      // Temporary files are cleaned up after extraction.
      fs.unlink(tempPath, () => {
        /* best-effort cleanup; ignore errors */
      });
    }
  },

  /**
   * POST /v1/resume/clean — normalize extracted resume text (Phase 6).
   * Body: { "rawText": "..." }
   */
  cleanResume(req: Request, res: Response, next: NextFunction): void {
    const { rawText } = req.body ?? {};

    if (typeof rawText !== "string") {
      next(
        IngestionErrors.validation("rawText is required and must be a string")
      );
      return;
    }

    const clean = cleanText(rawText);

    res.status(200).json({
      success: true,
      cleanText: clean,
    });
  },

  /**
   * POST /v1/resume/skills — deterministic skill detection (Phase 8).
   * Body: { "rawText": "..." }
   */
  skillsResume(req: Request, res: Response, next: NextFunction): void {
    const { rawText } = req.body ?? {};

    if (typeof rawText !== "string") {
      next(
        IngestionErrors.validation("rawText is required and must be a string")
      );
      return;
    }

    res.status(200).json({
      success: true,
      skills: detectSkills(rawText),
    });
  },

  /**
   * POST /v1/resume/parse — deterministic structured parsing (Phase 9).
   * Body: { "rawText": "..." }
   */
  parseResume(req: Request, res: Response, next: NextFunction): void {
    const { rawText } = req.body ?? {};

    if (typeof rawText !== "string") {
      next(
        IngestionErrors.validation("rawText is required and must be a string")
      );
      return;
    }

    try {
      const resume = algorithmResumeParser.parseResume(rawText);
      res.status(200).json({
        success: true,
        resume,
      });
    } catch (_err) {
      next(IngestionErrors.parseFailed());
    }
  },

  /**
   * POST /v1/resume/llm-parse — optional LLM-based parsing (Phase 10).
   * Behavior is configuration-driven via USE_LLM_PARSER. When disabled,
   * responds with LLM_PARSER_DISABLED.
   * Body: { "rawText": "..." }
   */
  async llmParseResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!env.USE_LLM_PARSER) {
      next(IngestionErrors.llmParserDisabled());
      return;
    }

    const { rawText } = req.body ?? {};
    if (typeof rawText !== "string") {
      next(
        IngestionErrors.validation("rawText is required and must be a string")
      );
      return;
    }

    try {
      const resume = await llmResumeParser.parseResume(rawText);
      res.status(200).json({
        success: true,
        parser: "llm",
        resume,
      });
    } catch (_err) {
      next(IngestionErrors.parseFailed());
    }
  },

  /**
   * POST /v1/resume/embed — generate a Mistral embedding (Phase 11).
   * Body: { name?, role?, skills?, company?, experienceSummary?, rawText }
   */
  async embedResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { name, role, skills, company, experienceSummary, rawText } =
      req.body ?? {};

    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(
        IngestionErrors.validation(
          "rawText is required and must be a non-empty string"
        )
      );
      return;
    }

    const embeddingText = embeddingService.buildEmbeddingInput({
      name,
      role,
      skills,
      company,
      experienceSummary,
      rawText,
    });

    try {
      const embedding = await embeddingService.generateEmbedding(embeddingText);

      if (embedding.length !== env.EMBEDDING_DIMENSION) {
        next(IngestionErrors.embeddingFailed());
        return;
      }

      res.status(200).json({
        success: true,
        model: env.MISTRAL_EMBED_MODEL,
        dimension: embedding.length,
        embedding,
      });
    } catch (_err) {
      next(IngestionErrors.embeddingFailed());
    }
  },

  /**
   * POST /v1/resume/store — store the resume document in MongoDB (Phase 12).
   * Body: { fileName, resume, rawText, embedding }
   */
  async storeResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { fileName, resume, rawText, embedding } = req.body ?? {};

    if (typeof fileName !== "string" || fileName.trim().length === 0) {
      next(IngestionErrors.validation("fileName is required"));
      return;
    }
    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(IngestionErrors.validation("rawText is required"));
      return;
    }
    if (!Array.isArray(embedding) || embedding.length === 0) {
      next(IngestionErrors.validation("embedding must be a non-empty array"));
      return;
    }
    if (!resume || typeof resume !== "object") {
      next(IngestionErrors.validation("resume object is required"));
      return;
    }

    const doc = buildResumeDocument({ fileName, resume, rawText, embedding });

    try {
      const resumeId = await resumeIngestionRepository.insertResume(doc);
      res.status(200).json({
        success: true,
        message: "Resume stored successfully",
        resumeId,
      });
    } catch (_err) {
      next(IngestionErrors.ingestionFailed());
    }
  },

  /**
   * POST /v1/resume/inject — full ingestion pipeline (Phase 13).
   * Upload -> extract -> clean -> parse -> embed -> store.
   */
  async injectResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.file) {
      next(IngestionErrors.fileRequired());
      return;
    }

    try {
      const result = await resumeIngestionService.injectResume(req.file);

      // Attach structured context for the request logger (Phase 15).
      // Note: the embedding vector and raw payload are intentionally excluded.
      res.locals.logContext = {
        fileName: req.file.originalname,
        ...result.timings,
      };

      res.status(200).json({
        success: true,
        message: "Resume ingestion completed",
        resumeId: result.resumeId,
        data: result.data,
        timings: result.timings,
      });
    } catch (err) {
      next(err);
    }
  },
};
