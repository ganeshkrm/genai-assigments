import { getResumesCollection } from "../../../config/database";
import { env } from "../../../config/env";

/**
 * Retrieval readiness check (Phase 1).
 *
 * Proves that ingestion has completed and retrieval has usable data:
 *   - resumes count > 0
 *   - at least one resume has a non-empty embedding
 *   - embedding dimension matches the configured model dimension
 *
 * Uses the same shared MongoDB connection as ingestion.
 */
export interface ReadinessResult {
  ready: boolean;
  collection?: string;
  resumeCount?: number;
  resumesWithEmbedding?: number;
  embeddingModel?: string;
  embeddingDimension?: number;
  reason?: string;
}

export class RetrievalValidationService {
  async checkReadiness(): Promise<ReadinessResult> {
    const collection = getResumesCollection();

    const resumeCount = await collection.countDocuments({});
    const resumesWithEmbedding = await collection.countDocuments({
      embedding: { $exists: true, $not: { $size: 0 } },
      embeddingDimension: env.EMBEDDING_DIMENSION,
    });

    const ready = resumeCount > 0 && resumesWithEmbedding > 0;

    if (!ready) {
      return {
        ready: false,
        reason: "No ingested resume embeddings are available",
      };
    }

    return {
      ready: true,
      collection: "resumes",
      resumeCount,
      resumesWithEmbedding,
      embeddingModel: env.MISTRAL_EMBED_MODEL,
      embeddingDimension: env.EMBEDDING_DIMENSION,
    };
  }
}
