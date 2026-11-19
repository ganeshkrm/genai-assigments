import apiClient from "./client";
import type {
  RetrievalResult,
  SearchMode,
  SearchTimings,
} from "@/types/search.types";

/**
 * Search API (Phase 13) — maps each UI search mode to the REAL backend
 * endpoint and normalises the (differently-shaped) responses into a single
 * RetrievalResult[] the UI renders.
 *
 *   vector → POST /v1/search/vector  → { results: [{ resumeId, name, role, vectorScore }] }
 *   bm25   → POST /v1/search/bm25    → { results: [{ resumeId, name, role, score, matchedSkills }] }
 *   hybrid → POST /v1/search         → { results: [{ rank, resumeId, name, role, company,
 *                                         totalExperience, skills, relevanceScore, summary, ... }] }
 */

interface VectorRow {
  resumeId: string;
  name: string | null;
  role: string | null;
  vectorScore: number;
}
interface Bm25Row {
  resumeId: string;
  name: string | null;
  role: string | null;
  score: number;
  matchedSkills?: string[];
}

export interface SearchParams {
  mode: SearchMode;
  query: string;
  topK: number;
}

export interface SearchOutcome {
  results: RetrievalResult[];
  mode: SearchMode;
  /** Full-pipeline metadata (hybrid/Smart Search only). */
  timings?: SearchTimings;
  degraded?: boolean;
  warnings?: string[];
  /** Candidates found by more than one retriever (dedup/union evidence). */
  mergedCount?: number;
}

async function vectorSearch(
  query: string,
  topK: number
): Promise<RetrievalResult[]> {
  const res = await apiClient.post("/v1/search/vector", { query, topK });
  const rows: VectorRow[] = res.data?.results ?? [];
  return rows.map((r) => ({
    resumeId: r.resumeId,
    name: r.name ?? "Unknown",
    role: r.role,
    score: r.vectorScore,
    sources: ["vector"],
  }));
}

async function bm25Search(
  query: string,
  topK: number
): Promise<RetrievalResult[]> {
  const res = await apiClient.post("/v1/search/bm25", { query, topK });
  const rows: Bm25Row[] = res.data?.results ?? [];
  return rows.map((r) => ({
    resumeId: r.resumeId,
    name: r.name ?? "Unknown",
    role: r.role,
    score: r.score,
    matchedSkills: r.matchedSkills ?? [],
    sources: ["bm25"],
  }));
}

async function hybridSearch(
  query: string,
  topK: number
): Promise<Omit<SearchOutcome, "mode">> {
  // Full reranked + summarised pipeline. Weights are not a backend parameter
  // (the sliders are presentational — see Phase 11/13 notes).
  const res = await apiClient.post("/v1/search", {
    query,
    options: { finalTopK: topK, summarize: true },
  });
  const rows: RetrievalResult[] = res.data?.results ?? [];
  const results = rows.map((r) => ({
    ...r,
    name: r.name ?? "Unknown",
    // Use the reranked relevanceScore as the card's primary score.
    score: typeof r.relevanceScore === "number" ? r.relevanceScore : r.score,
  }));
  // Candidates surfaced by >1 retriever were merged during de-duplication.
  const mergedCount = results.filter(
    (r) => Array.isArray(r.sources) && r.sources.length > 1
  ).length;
  return {
    results,
    timings: res.data?.timings,
    degraded: res.data?.degraded,
    warnings: res.data?.warnings,
    mergedCount,
  };
}

export const searchApi = {
  async searchResumes(params: SearchParams): Promise<SearchOutcome> {
    const { mode, query, topK } = params;
    if (mode === "vector") {
      return { results: await vectorSearch(query, topK), mode };
    }
    if (mode === "bm25") {
      return { results: await bm25Search(query, topK), mode };
    }
    const h = await hybridSearch(query, topK);
    return { mode, ...h };
  },
};
