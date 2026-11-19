import { Document } from "mongodb";
import { getResumesCollection } from "../../../config/database";
import { ParsedResume } from "../types/ingestion.types";
import { env } from "../../../config/env";

/**
 * Build the final `resumes` document from the ingestion parts, following the
 * architecture's recommended shape. Fields that are absent are stored as null
 * (never invented), skills/jobTitles default to arrays.
 */
export function buildResumeDocument(params: {
  fileName: string;
  resume: Partial<ParsedResume>;
  rawText: string;
  embedding: number[];
}): Document {
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
    embeddingModel: env.MISTRAL_EMBED_MODEL,
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
export class ResumeIngestionRepository {
  async insertResume(doc: Document): Promise<string> {
    const collection = getResumesCollection();
    const result = await collection.insertOne(doc);
    return result.insertedId.toString();
  }
}
