/**
 * Retrieval search types — aligned to the REAL backend contract
 * (`POST /v1/search` and the `/v1/search/{vector,bm25,hybrid}` endpoints),
 * not the MD's older `/search/resumes` shape.
 */

/** UI-facing search mode. Maps to backend endpoints in the search service. */
export type SearchMode = "vector" | "bm25" | "hybrid";

export interface SearchFilters {
  minYearsExperience?: number;
}

/** Options accepted by `POST /v1/search` (all optional, server-capped). */
export interface SearchOptions {
  bm25TopK?: number;
  vectorTopK?: number;
  rerankTopN?: number;
  finalTopK?: number;
  summarize?: boolean;
  summaryStyle?: "short" | "detailed";
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  options?: SearchOptions;
}

/**
 * A single ranked candidate. The full `/v1/search` pipeline returns the richer
 * fields (relevanceScore/reason/summary); the simpler bm25/vector/hybrid
 * endpoints may instead return score/snippet — kept optional for both.
 */
export interface RetrievalResult {
  rank?: number;
  resumeId: string;
  name: string;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skills?: string[];
  sources?: string[]; // e.g. ["bm25", "vector"]
  relevanceScore?: number;
  reason?: string;
  summary?: string;
  // Simpler endpoints:
  score?: number;
  snippet?: string;
  matchedSkills?: string[];
}

export interface SearchTimings {
  embeddingMs?: number;
  bm25Ms?: number;
  vectorMs?: number;
  rerankMs?: number;
  summarizeMs?: number;
  totalMs?: number;
}

export interface SearchResponse {
  query: string;
  results: RetrievalResult[];
  degraded?: boolean;
  warnings?: string[];
  vectorFallback?: boolean;
  bm25Fallback?: boolean;
  timings?: SearchTimings;
}
