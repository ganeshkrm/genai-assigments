import {
  SearchCandidate,
  SearchFilters,
  SearchOptions,
} from "../types/retrieval.types";
import { ResumeRepository } from "../repositories/ResumeRepository";
import { EmbeddingService } from "../../../shared/services/EmbeddingService";
import { LLMService } from "../services/LLMService";
import { mapResumeToCandidate } from "../utils/candidateMapper";
import { deduplicateCandidates } from "../utils/deduplicate";
import { env } from "../../../config/env";
import { AppError } from "../../../middleware/errorHandler";

export interface FinalSearchResult {
  rank: number;
  resumeId: string;
  name: string | null;
  role: string | null;
  company: string | null;
  totalExperience: number | null;
  skills: string[];
  sources: ("bm25" | "vector")[];
  relevanceScore?: number;
  reason?: string;
  summary?: string;
}

export interface EndToEndSearchResponse {
  results: FinalSearchResult[];
  degraded: boolean;
  warnings: string[];
  vectorFallback?: boolean;
  bm25Fallback?: boolean;
  timings: {
    embeddingMs: number;
    bm25Ms: number;
    vectorMs: number;
    rerankMs: number;
    summarizeMs: number;
    totalMs: number;
  };
}

/**
 * Search orchestration (Phases 7, 8, 13).
 *
 * Phase 7 implements the independent bm25Search and vectorSearch methods,
 * each returning the normalized SearchCandidate shape. Hybrid and end-to-end
 * orchestration arrive in Phases 8 and 13.
 */
export class SearchService {
  private readonly repository = new ResumeRepository();
  private readonly embeddingService = new EmbeddingService();
  private readonly llmService = new LLMService();

  /** Lexical BM25 search -> normalized candidates (source: "bm25"). */
  async bm25Search(
    query: string,
    filters: SearchFilters,
    topK: number
  ): Promise<SearchCandidate[]> {
    const minYears =
      typeof filters?.minYearsExperience === "number"
        ? filters.minYearsExperience
        : undefined;
    const docs = await this.repository.bm25Search(query, minYears, topK);
    return docs.map((d) => mapResumeToCandidate(d, "bm25"));
  }

  /** Semantic vector search -> normalized candidates (source: "vector"). */
  async vectorSearch(
    query: string,
    filters: SearchFilters,
    topK: number
  ): Promise<SearchCandidate[]> {
    const queryVector = await this.embeddingService.generateEmbedding(query);
    let docs = await this.repository.vectorSearch(queryVector, topK);

    // Apply the experience filter post-hoc (Atlas $vectorSearch ANN runs first).
    const minYears = filters?.minYearsExperience;
    if (typeof minYears === "number") {
      docs = docs.filter(
        (d) => typeof d.totalExperience === "number" && d.totalExperience >= minYears
      );
    }

    return docs.map((d) => mapResumeToCandidate(d, "vector"));
  }

  /**
   * Hybrid search (Phase 8): run BM25 and vector search independently and in
   * parallel. Scores are NOT merged into a single mathematical score — each
   * list keeps its own score. Primarily a debugging/exploration endpoint.
   */
  async hybridSearch(
    query: string,
    filters: SearchFilters,
    topK: number
  ): Promise<{
    bm25: SearchCandidate[];
    vector: SearchCandidate[];
    timings: { bm25Ms: number; embeddingMs: number; vectorMs: number };
  }> {
    const minYears =
      typeof filters?.minYearsExperience === "number"
        ? filters.minYearsExperience
        : undefined;

    // BM25 branch (runs in parallel with the vector branch).
    const bm25Branch = (async () => {
      const t = Date.now();
      const docs = await this.repository.bm25Search(query, minYears, topK);
      return {
        candidates: docs.map((d) => mapResumeToCandidate(d, "bm25")),
        ms: Date.now() - t,
      };
    })();

    // Vector branch: on-demand embedding, then ANN search.
    const vectorBranch = (async () => {
      const te = Date.now();
      const queryVector = await this.embeddingService.generateEmbedding(query);
      const embeddingMs = Date.now() - te;

      const tv = Date.now();
      let docs = await this.repository.vectorSearch(queryVector, topK);
      const vectorMs = Date.now() - tv;

      if (typeof minYears === "number") {
        docs = docs.filter(
          (d) =>
            typeof d.totalExperience === "number" &&
            d.totalExperience >= minYears
        );
      }
      return {
        candidates: docs.map((d) => mapResumeToCandidate(d, "vector")),
        embeddingMs,
        vectorMs,
      };
    })();

    const [bm25Res, vectorRes] = await Promise.all([bm25Branch, vectorBranch]);
    return {
      bm25: bm25Res.candidates,
      vector: vectorRes.candidates,
      timings: {
        bm25Ms: bm25Res.ms,
        embeddingMs: vectorRes.embeddingMs,
        vectorMs: vectorRes.vectorMs,
      },
    };
  }

  /**
   * Full synchronous search pipeline (Phase 13) with graceful fallbacks
   * (Phase 15):
   *   embed + BM25 (parallel) -> merge/dedup -> LLM re-rank -> optional summary.
   *
   * Fallbacks:
   *   - vector fails    -> BM25 only            (vectorFallback)
   *   - BM25 fails      -> vector only          (bm25Fallback)
   *   - both fail       -> throw SEARCH_UNAVAILABLE
   *   - re-rank fails   -> BM25-priority order  (warning LLM_RERANK_FAILED)
   *   - summarize fails -> results w/o summary  (warning SUMMARIZATION_FAILED)
   */
  async endToEndSearch(
    query: string,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<EndToEndSearchResponse> {
    const start = Date.now();
    const warnings: string[] = [];
    let degraded = false;

    const minYears =
      typeof filters?.minYearsExperience === "number"
        ? filters.minYearsExperience
        : undefined;
    const bm25TopK = options.bm25TopK ?? env.RETRIEVAL_DEFAULT_TOP_K;
    const vectorTopK = options.vectorTopK ?? env.RETRIEVAL_DEFAULT_TOP_K;
    const rerankTopN = options.rerankTopN ?? env.RERANK_DEFAULT_TOP_N;
    const finalTopK = options.finalTopK ?? 5;

    const timings = {
      embeddingMs: 0,
      bm25Ms: 0,
      vectorMs: 0,
      rerankMs: 0,
      summarizeMs: 0,
      totalMs: 0,
    };

    // --- BM25 + vector in parallel, each independently fallible. ---
    let bm25Failed = false;
    let vectorFailed = false;

    const bm25Branch = (async () => {
      const t = Date.now();
      try {
        const docs = await this.repository.bm25Search(query, minYears, bm25TopK);
        timings.bm25Ms = Date.now() - t;
        return docs.map((d) => mapResumeToCandidate(d, "bm25"));
      } catch {
        timings.bm25Ms = Date.now() - t;
        bm25Failed = true;
        return [] as SearchCandidate[];
      }
    })();

    const vectorBranch = (async () => {
      try {
        const te = Date.now();
        const queryVector = await this.embeddingService.generateEmbedding(query);
        timings.embeddingMs = Date.now() - te;
        const tv = Date.now();
        let docs = await this.repository.vectorSearch(queryVector, vectorTopK);
        timings.vectorMs = Date.now() - tv;
        if (typeof minYears === "number") {
          docs = docs.filter(
            (d) =>
              typeof d.totalExperience === "number" &&
              d.totalExperience >= minYears
          );
        }
        return docs.map((d) => mapResumeToCandidate(d, "vector"));
      } catch {
        vectorFailed = true;
        return [] as SearchCandidate[];
      }
    })();

    const [bm25Candidates, vectorCandidates] = await Promise.all([
      bm25Branch,
      vectorBranch,
    ]);

    if (bm25Failed && vectorFailed) {
      throw new AppError(
        503,
        "SEARCH_UNAVAILABLE",
        "No retrieval strategy is currently available"
      );
    }

    const result: EndToEndSearchResponse = {
      results: [],
      degraded: false,
      warnings,
      timings,
    };
    if (vectorFailed) {
      degraded = true;
      result.vectorFallback = true;
    }
    if (bm25Failed) {
      degraded = true;
      result.bm25Fallback = true;
    }

    // --- Merge + dedup (BM25 first => BM25-priority fallback ordering). ---
    const pool = deduplicateCandidates(bm25Candidates, vectorCandidates);
    const byId = new Map(pool.map((c) => [c.resumeId, c]));
    const rerankInput = pool.slice(0, rerankTopN);

    // --- LLM re-rank (fallback to BM25-priority order on failure). ---
    let orderedIds: string[];
    const rerankById = new Map<
      string,
      { relevanceScore: number; reason?: string }
    >();
    const tr = Date.now();
    try {
      const reranked = await this.llmService.rerankCandidates(
        query,
        rerankInput,
        finalTopK
      );
      timings.rerankMs = Date.now() - tr;
      orderedIds = reranked.map((r) => r.resumeId);
      for (const r of reranked) {
        rerankById.set(r.resumeId, {
          relevanceScore: r.relevanceScore,
          reason: r.reason,
        });
      }
    } catch {
      timings.rerankMs = Date.now() - tr;
      degraded = true;
      warnings.push("LLM_RERANK_FAILED");
      orderedIds = rerankInput.slice(0, finalTopK).map((c) => c.resumeId);
    }

    // --- Build final candidates (hydrate from pool). ---
    const finalCandidates = orderedIds
      .map((id) => byId.get(id))
      .filter((c): c is SearchCandidate => Boolean(c))
      .slice(0, finalTopK);

    // --- Optional summaries (failure never drops results). ---
    if (options.summarize && finalCandidates.length > 0) {
      const ts = Date.now();
      const style = options.summaryStyle === "detailed" ? "detailed" : "short";
      const settled = await Promise.allSettled(
        finalCandidates.map((c) =>
          this.llmService.summarizeCandidateFit(query, c, { style })
        )
      );
      timings.summarizeMs = Date.now() - ts;
      if (settled.some((s) => s.status === "rejected")) {
        degraded = true;
        warnings.push("SUMMARIZATION_FAILED");
      }
      settled.forEach((s, i) => {
        if (s.status === "fulfilled") {
          (finalCandidates[i] as SearchCandidate & { summary?: string }).summary =
            s.value;
        }
      });
    }

    result.results = finalCandidates.map((c, i) => ({
      rank: i + 1,
      resumeId: c.resumeId,
      name: c.name ?? null,
      role: c.role ?? null,
      company: c.company ?? null,
      totalExperience: c.totalExperience ?? null,
      skills: c.skills ?? [],
      sources: c.sources,
      relevanceScore: rerankById.get(c.resumeId)?.relevanceScore,
      reason: rerankById.get(c.resumeId)?.reason,
      summary: (c as SearchCandidate & { summary?: string }).summary,
    }));

    result.degraded = degraded;
    timings.totalMs = Date.now() - start;
    return result;
  }
}
