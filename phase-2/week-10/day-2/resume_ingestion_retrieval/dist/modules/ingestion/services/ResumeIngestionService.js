"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeIngestionService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const errorHandler_1 = require("../../../middleware/errorHandler");
const env_1 = require("../../../config/env");
const textCleaner_1 = require("../utils/textCleaner");
const ResumeParserService_1 = require("./ResumeParserService");
const EmbeddingService_1 = require("./EmbeddingService");
const ResumeParserFactory_1 = require("./ResumeParserFactory");
const ResumeIngestionRepository_1 = require("../repositories/ResumeIngestionRepository");
/**
 * Orchestrates the full ingestion pipeline (Phase 13):
 *
 *   Validate PDF -> Extract -> Clean -> Parse (algorithm/LLM) ->
 *   Skills + Metadata -> Mistral Embedding -> Store in MongoDB ->
 *   Return resumeId + parsed summary + timings.
 *
 * Each failure stage maps to its stable error code from the Phase-14 table.
 */
class ResumeIngestionService {
    constructor() {
        this.parserService = new ResumeParserService_1.ResumeParserService();
        this.embeddingService = new EmbeddingService_1.EmbeddingService();
        this.repository = new ResumeIngestionRepository_1.ResumeIngestionRepository();
    }
    /**
     * HTTP entrypoint: extract text from an uploaded PDF, then run the pipeline.
     * Always removes the uploaded temp file afterwards.
     */
    async injectResume(file) {
        try {
            const extractStart = Date.now();
            let rawText;
            try {
                rawText = await this.parserService.extractTextFromPdf(file.path);
            }
            catch {
                throw errorHandler_1.IngestionErrors.extractionFailed();
            }
            if (!rawText || rawText.trim().length === 0) {
                throw errorHandler_1.IngestionErrors.extractionFailed();
            }
            const extractMs = Date.now() - extractStart;
            return await this.runPipeline(file.originalname, rawText, extractMs);
        }
        finally {
            // Always clean up the uploaded temp file.
            await promises_1.default.unlink(file.path).catch(() => {
                /* best-effort cleanup */
            });
        }
    }
    /**
     * Batch/CLI entrypoint (Phase 17): run the pipeline on already-extracted text
     * (e.g. from a .doc/.docx/.pdf extracted by the batch job). Does NOT touch
     * the source file — the caller owns it.
     */
    async ingestFromText(fileName, rawText) {
        if (!rawText || rawText.trim().length === 0) {
            throw errorHandler_1.IngestionErrors.extractionFailed();
        }
        return this.runPipeline(fileName, rawText, 0);
    }
    /**
     * Shared pipeline: clean -> parse -> Mistral embed -> store. Reused by both
     * the HTTP and batch entrypoints. `extractMs` is the time already spent
     * extracting text before this step.
     */
    async runPipeline(fileName, rawText, extractMs) {
        const start = Date.now();
        const timings = {
            extractMs,
            cleanMs: 0,
            parseMs: 0,
            embeddingMs: 0,
            mongoInsertMs: 0,
            totalMs: 0,
        };
        // 1. Clean text.
        let t = Date.now();
        const cleaned = (0, textCleaner_1.cleanText)(rawText);
        timings.cleanMs = Date.now() - t;
        // 2. Parse (algorithm or LLM, per USE_LLM_PARSER).
        t = Date.now();
        let resume;
        try {
            resume = await (0, ResumeParserFactory_1.createResumeParser)().parse(cleaned);
        }
        catch {
            throw errorHandler_1.IngestionErrors.parseFailed();
        }
        timings.parseMs = Date.now() - t;
        // 3. Generate Mistral embedding.
        t = Date.now();
        let embedding;
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
        }
        catch {
            throw errorHandler_1.IngestionErrors.embeddingFailed();
        }
        if (embedding.length !== env_1.env.EMBEDDING_DIMENSION) {
            throw errorHandler_1.IngestionErrors.embeddingFailed();
        }
        timings.embeddingMs = Date.now() - t;
        // 4. Store in MongoDB.
        t = Date.now();
        let resumeId;
        try {
            const doc = (0, ResumeIngestionRepository_1.buildResumeDocument)({
                fileName,
                resume,
                rawText: cleaned,
                embedding,
            });
            resumeId = await this.repository.insertResume(doc);
        }
        catch {
            throw errorHandler_1.IngestionErrors.ingestionFailed();
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
                embeddingModel: env_1.env.MISTRAL_EMBED_MODEL,
                embeddingDimension: embedding.length,
            },
            timings,
        };
    }
}
exports.ResumeIngestionService = ResumeIngestionService;
//# sourceMappingURL=ResumeIngestionService.js.map