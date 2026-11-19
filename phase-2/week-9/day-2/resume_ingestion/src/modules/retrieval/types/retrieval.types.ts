/**
 * Shared retrieval type definitions.
 */

/** Optional filters applied to search. */
export interface SearchFilters {
  minYearsExperience?: number;
}

/** Normalized candidate shape produced by BM25 and vector search (Phase 7). */
export interface SearchCandidate {
  resumeId: string;
  name?: string;
  role?: string;
  company?: string;
  skills?: string[];
  totalExperience?: number;
  snippet?: string;
  bm25Score?: number;
  vectorScore?: number;
  sources: ("bm25" | "vector")[];
}

/** Options for the end-to-end search pipeline (Phase 13/14). */
export interface SearchOptions {
  bm25TopK?: number;
  vectorTopK?: number;
  rerankTopN?: number;
  finalTopK?: number;
  summarize?: boolean;
  summaryStyle?: "short" | "detailed";
}

/** Result of LLM re-ranking (Phase 10/11). */
export interface RerankResult {
  resumeId: string;
  rank: number;
  relevanceScore: number;
  reason?: string;
}
