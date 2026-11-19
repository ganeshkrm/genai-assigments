"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeIngestionRepository = void 0;
exports.buildResumeDocument = buildResumeDocument;
const database_1 = require("../../../config/database");
const env_1 = require("../../../config/env");
/**
 * Build the final `resumes` document from the ingestion parts, following the
 * architecture's recommended shape. Fields that are absent are stored as null
 * (never invented), skills/jobTitles default to arrays.
 */
function buildResumeDocument(params) {
    const { fileName, resume, rawText, embedding } = params;
    const now = new Date();
    return {
        fileName,
        rawText,
        name: resume.name ?? null,
        email: resume.email ?? null,
        phone: resume.phone ?? null,
        location: resume.location ?? null,
        company: resume.company ?? null,
        role: resume.role ?? null,
        education: resume.education ?? null,
        totalExperience: resume.totalExperience ?? null,
        relevantExperience: resume.relevantExperience ?? null,
        skills: Array.isArray(resume.skills) ? resume.skills : [],
        jobTitles: Array.isArray(resume.jobTitles) ? resume.jobTitles : [],
        experienceSummary: resume.experienceSummary ?? null,
        embedding,
        embeddingModel: env_1.env.MISTRAL_EMBED_MODEL,
        embeddingDimension: embedding.length,
        createdAt: now,
        updatedAt: now,
    };
}
/**
 * Persists resume documents to the `resumes` collection (Phase 12).
 *
 * Uses the shared MongoDB connection (never a per-request connection).
 * A single insertOne is performed per call, so no unintended duplicate
 * insert occurs.
 */
class ResumeIngestionRepository {
    async insertResume(doc) {
        const collection = (0, database_1.getResumesCollection)();
        const result = await collection.insertOne(doc);
        return result.insertedId.toString();
    }
}
exports.ResumeIngestionRepository = ResumeIngestionRepository;
//# sourceMappingURL=ResumeIngestionRepository.js.map