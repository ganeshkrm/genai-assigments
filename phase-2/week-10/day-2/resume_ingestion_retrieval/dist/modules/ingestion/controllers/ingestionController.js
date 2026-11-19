"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestionController = void 0;
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("../../../middleware/errorHandler");
const ResumeParserService_1 = require("../services/ResumeParserService");
const AlgorithmResumeParser_1 = require("../services/AlgorithmResumeParser");
const LLMResumeParser_1 = require("../services/LLMResumeParser");
const EmbeddingService_1 = require("../services/EmbeddingService");
const ResumeIngestionService_1 = require("../services/ResumeIngestionService");
const ResumeIngestionRepository_1 = require("../repositories/ResumeIngestionRepository");
const textCleaner_1 = require("../utils/textCleaner");
const skills_1 = require("../../../config/skills");
const env_1 = require("../../../config/env");
const resumeParserService = new ResumeParserService_1.ResumeParserService();
const algorithmResumeParser = new AlgorithmResumeParser_1.AlgorithmResumeParser();
const llmResumeParser = new LLMResumeParser_1.LLMResumeParser();
const embeddingService = new EmbeddingService_1.EmbeddingService();
const resumeIngestionRepository = new ResumeIngestionRepository_1.ResumeIngestionRepository();
const resumeIngestionService = new ResumeIngestionService_1.ResumeIngestionService();
/**
 * Ingestion controller.
 *
 * Phase 3: temporary module readiness handler.
 * Phase 4: secure PDF upload handler.
 * Later phases add extract/parse/embed/store/inject handlers.
 */
exports.ingestionController = {
    /**
     * GET /v1/resume/health — temporary module readiness check (Phase 3).
     */
    resumeHealth(_req, res) {
        res.status(200).json({
            status: "ok",
            module: "resume-ingestion",
        });
    },
    /**
     * POST /v1/resume/upload — secure PDF upload (Phase 4).
     * The multer middleware has already validated type and size.
     */
    uploadResume(req, res, next) {
        if (!req.file) {
            next(errorHandler_1.IngestionErrors.fileRequired());
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
        fs_1.default.unlink(tempPath, () => {
            /* best-effort cleanup; ignore errors */
        });
    },
    /**
     * POST /v1/resume/extract — extract raw text from an uploaded PDF (Phase 5).
     */
    async extractResume(req, res, next) {
        if (!req.file) {
            next(errorHandler_1.IngestionErrors.fileRequired());
            return;
        }
        const tempPath = req.file.path;
        try {
            const rawText = await resumeParserService.extractTextFromPdf(tempPath);
            if (!rawText || rawText.length === 0) {
                next(errorHandler_1.IngestionErrors.extractionFailed());
                return;
            }
            res.status(200).json({
                success: true,
                rawText,
                characters: rawText.length,
            });
        }
        catch (_err) {
            next(errorHandler_1.IngestionErrors.extractionFailed());
        }
        finally {
            // Temporary files are cleaned up after extraction.
            fs_1.default.unlink(tempPath, () => {
                /* best-effort cleanup; ignore errors */
            });
        }
    },
    /**
     * POST /v1/resume/clean — normalize extracted resume text (Phase 6).
     * Body: { "rawText": "..." }
     */
    cleanResume(req, res, next) {
        const { rawText } = req.body ?? {};
        if (typeof rawText !== "string") {
            next(errorHandler_1.IngestionErrors.validation("rawText is required and must be a string"));
            return;
        }
        const clean = (0, textCleaner_1.cleanText)(rawText);
        res.status(200).json({
            success: true,
            cleanText: clean,
        });
    },
    /**
     * POST /v1/resume/skills — deterministic skill detection (Phase 8).
     * Body: { "rawText": "..." }
     */
    skillsResume(req, res, next) {
        const { rawText } = req.body ?? {};
        if (typeof rawText !== "string") {
            next(errorHandler_1.IngestionErrors.validation("rawText is required and must be a string"));
            return;
        }
        res.status(200).json({
            success: true,
            skills: (0, skills_1.detectSkills)(rawText),
        });
    },
    /**
     * POST /v1/resume/parse — deterministic structured parsing (Phase 9).
     * Body: { "rawText": "..." }
     */
    parseResume(req, res, next) {
        const { rawText } = req.body ?? {};
        if (typeof rawText !== "string") {
            next(errorHandler_1.IngestionErrors.validation("rawText is required and must be a string"));
            return;
        }
        try {
            const resume = algorithmResumeParser.parseResume(rawText);
            res.status(200).json({
                success: true,
                resume,
            });
        }
        catch (_err) {
            next(errorHandler_1.IngestionErrors.parseFailed());
        }
    },
    /**
     * POST /v1/resume/llm-parse — optional LLM-based parsing (Phase 10).
     * Behavior is configuration-driven via USE_LLM_PARSER. When disabled,
     * responds with LLM_PARSER_DISABLED.
     * Body: { "rawText": "..." }
     */
    async llmParseResume(req, res, next) {
        if (!env_1.env.USE_LLM_PARSER) {
            next(errorHandler_1.IngestionErrors.llmParserDisabled());
            return;
        }
        const { rawText } = req.body ?? {};
        if (typeof rawText !== "string") {
            next(errorHandler_1.IngestionErrors.validation("rawText is required and must be a string"));
            return;
        }
        try {
            const resume = await llmResumeParser.parseResume(rawText);
            res.status(200).json({
                success: true,
                parser: "llm",
                resume,
            });
        }
        catch (_err) {
            next(errorHandler_1.IngestionErrors.parseFailed());
        }
    },
    /**
     * POST /v1/resume/embed — generate a Mistral embedding (Phase 11).
     * Body: { name?, role?, skills?, company?, experienceSummary?, rawText }
     */
    async embedResume(req, res, next) {
        const { name, role, skills, company, experienceSummary, rawText } = req.body ?? {};
        if (typeof rawText !== "string" || rawText.trim().length === 0) {
            next(errorHandler_1.IngestionErrors.validation("rawText is required and must be a non-empty string"));
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
            if (embedding.length !== env_1.env.EMBEDDING_DIMENSION) {
                next(errorHandler_1.IngestionErrors.embeddingFailed());
                return;
            }
            res.status(200).json({
                success: true,
                model: env_1.env.MISTRAL_EMBED_MODEL,
                dimension: embedding.length,
                embedding,
            });
        }
        catch (_err) {
            next(errorHandler_1.IngestionErrors.embeddingFailed());
        }
    },
    /**
     * POST /v1/resume/store — store the resume document in MongoDB (Phase 12).
     * Body: { fileName, resume, rawText, embedding }
     */
    async storeResume(req, res, next) {
        const { fileName, resume, rawText, embedding } = req.body ?? {};
        if (typeof fileName !== "string" || fileName.trim().length === 0) {
            next(errorHandler_1.IngestionErrors.validation("fileName is required"));
            return;
        }
        if (typeof rawText !== "string" || rawText.trim().length === 0) {
            next(errorHandler_1.IngestionErrors.validation("rawText is required"));
            return;
        }
        if (!Array.isArray(embedding) || embedding.length === 0) {
            next(errorHandler_1.IngestionErrors.validation("embedding must be a non-empty array"));
            return;
        }
        if (!resume || typeof resume !== "object") {
            next(errorHandler_1.IngestionErrors.validation("resume object is required"));
            return;
        }
        const doc = (0, ResumeIngestionRepository_1.buildResumeDocument)({ fileName, resume, rawText, embedding });
        try {
            const resumeId = await resumeIngestionRepository.insertResume(doc);
            res.status(200).json({
                success: true,
                message: "Resume stored successfully",
                resumeId,
            });
        }
        catch (_err) {
            next(errorHandler_1.IngestionErrors.ingestionFailed());
        }
    },
    /**
     * POST /v1/resume/inject — full ingestion pipeline (Phase 13).
     * Upload -> extract -> clean -> parse -> embed -> store.
     */
    async injectResume(req, res, next) {
        if (!req.file) {
            next(errorHandler_1.IngestionErrors.fileRequired());
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
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=ingestionController.js.map