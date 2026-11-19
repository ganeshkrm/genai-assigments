/**
 * Shared ingestion type definitions.
 * The structured resume schema is produced by the resume parsers
 * (Algorithm parser in Phase 9, optional LLM parser in Phase 10).
 */
export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  company?: string;
  role?: string;
  education?: string;
  totalExperience?: number;
  relevantExperience?: number;
  skills: string[];
  jobTitles?: string[];
  experienceSummary?: string;
}

/**
 * Final document persisted to the `resumes` collection (Phase 12).
 */
export interface ResumeDocument extends ParsedResume {
  fileName: string;
  rawText: string;
  embedding: number[];
  embeddingModel: string;
  embeddingDimension: number;
  createdAt: Date;
  updatedAt: Date;
}
