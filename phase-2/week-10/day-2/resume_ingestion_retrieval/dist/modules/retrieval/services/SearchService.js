"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const ResumeRepository_1 = require("../repositories/ResumeRepository");
const EmbeddingService_1 = require("../../../shared/services/EmbeddingService");
const LLMService_1 = require("../services/LLMService");
const candidateMapper_1 = require("../utils/candidateMapper");
const deduplicate_1 = require("../utils/deduplicate");
const env_1 = require("../../../config/env");
const errorHandler_1 = require("../../../middleware/errorHandler");
/**
 * Search orchestration (Phases 7, 8, 13).
 *
 * Phase 7 implements the independent bm25Search and vectorSearch methods,
 * each returning the normalized SearchCandidate shape. Hybrid and end-to-end
 * orchestration arrive in Phases 8 and 13.
 */
class SearchService {
    constructor() {
        this.repository = new ResumeRepository_1.ResumeRepository();
        this.embeddingService = new EmbeddingService_1.EmbeddingService();
        this.llmService = new LLMService_1.LLMService();
    }
    /** Lexical BM25 search -> normalized candidates (source: "bm25"). */
    async bm25Search(query, filters, topK) {
        const minYears = typeof filters?.minYearsExperience === "number"
            ? filters.minYearsExperience
            : undefined;
        const docs = await this.repository.bm25Search(query, minYears, topK);
        return docs.map((d) => (0, candidateMapper_1.mapResumeToCandidate)(d, "bm25"));
    }
    /** Semantic vector search -> normalized candidates (source: "vector"). */
    async vectorSearch(query, filters, topK) {
        const queryVector = await this.embeddingService.generateEmbedding(query);
        let docs = await this.repository.vectorSearch(queryVector, topK);
        // Apply the experience filter post-hoc (Atlas $vectorSearch ANN runs first).
        const minYears = filters?.minYearsExperience;
        if (typeof minYears === "number") {
            docs = docs.filter((d) => typeof d.totalExperience === "number" && d.totalExperience >= minYears);
        }
        return docs.map((d) => (0, candidateMapper_1.mapResumeToCandidate)(d, "vector"));
    }
    /**
     * Hybrid search (Phase 8): run BM25 and vector search independently and in
     * parallel. Scores are NOT merged into a single mathematical score — each
     * list keeps its own score. Primarily a debugging/exploration endpoint.
     */
    async hybridSearch(query, filters, topK) {
        const minYears = typeof filters?.minYearsExperience === "number"
            ? filters.minYearsExperience
            : undefined;
        // BM25 branch (runs in parallel with the vector branch).
        const bm25Branch = (async () => {
            const t = Date.now();
            const docs = await this.repository.bm25Search(query, minYears, topK);
            return {
                candidates: docs.map((d) => (0, candidateMapper_1.mapResumeToCandidate)(d, "bm25")),
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
                docs = docs.filter((d) => typeof d.totalExperience === "number" &&
                    d.totalExperience >= minYears);
            }
            return {
                candidates: docs.map((d) => (0, candidateMapper_1.mapResumeToCandidate)(d, "vector")),
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
    async endToEndSearch(query, filters, options) {
        const start = Date.now();
        const warnings = [];
        let degraded = false;
        const minYears = typeof filters?.minYearsExperience === "number"
            ? filters.minYearsExperience
            : undefined;
        const bm25TopK = options.bm25TopK ?? env_1.env.RETRIEVAL_DEFAULT_TOP_K;
        const vectorTopK = options.vectorTopK ?? env_1.env.RETRIEVAL_DEFAULT_TOP_K;
        const rerankTopN = options.rerankTopN ?? env_1.env.RERANK_DEFAULT_TOP_N;
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
                return docs.map((d) => (0, candidateMapper_1.mapResumeToCandidate)(d, "bm25"));
            }
            catch {
                timings.bm25Ms = Date.now() - t;
                bm25Failed = true;
                return [];
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
                    docs = docs.filter((d) => typeof d.totalExperience === "number" &&
                        d.totalExperience >= minYears);
                }
                return docs.map((d) => (0, candidateMapper_1.mapResumeToCandidate)(d, "vector"));
            }
            catch {
                vectorFailed = true;
                return [];
            }
        })();
        const [bm25Candidates, vectorCandidates] = await Promise.all([
            bm25Branch,
            vectorBranch,
        ]);
        if (bm25Failed && vectorFailed) {
            throw new errorHandler_1.AppError(503, "SEARCH_UNAVAILABLE", "No retrieval strategy is currently available");
        }
        const result = {
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
        const pool = (0, deduplicate_1.deduplicateCandidates)(bm25Candidates, vectorCandidates);
        const byId = new Map(pool.map((c) => [c.resumeId, c]));
        const rerankInput = pool.slice(0, rerankTopN);
        // --- LLM re-rank (fallback to BM25-priority order on failure). ---
        let orderedIds;
        const rerankById = new Map();
        const tr = Date.now();
        try {
            const reranked = await this.llmService.rerankCandidates(query, rerankInput, finalTopK);
            timings.rerankMs = Date.now() - tr;
            orderedIds = reranked.map((r) => r.resumeId);
            for (const r of reranked) {
                rerankById.set(r.resumeId, {
                    relevanceScore: r.relevanceScore,
                    reason: r.reason,
                });
            }
        }
        catch {
            timings.rerankMs = Date.now() - tr;
            degraded = true;
            warnings.push("LLM_RERANK_FAILED");
            orderedIds = rerankInput.slice(0, finalTopK).map((c) => c.resumeId);
        }
        // --- Build final candidates (hydrate from pool). ---
        const finalCandidates = orderedIds
            .map((id) => byId.get(id))
            .filter((c) => Boolean(c))
            .slice(0, finalTopK);
        // --- Optional summaries (failure never drops results). ---
        if (options.summarize && finalCandidates.length > 0) {
            const ts = Date.now();
            const style = options.summaryStyle === "detailed" ? "detailed" : "short";
            const settled = await Promise.allSettled(finalCandidates.map((c) => this.llmService.summarizeCandidateFit(query, c, { style })));
            timings.summarizeMs = Date.now() - ts;
            if (settled.some((s) => s.status === "rejected")) {
                degraded = true;
                warnings.push("SUMMARIZATION_FAILED");
            }
            settled.forEach((s, i) => {
                if (s.status === "fulfilled") {
                    finalCandidates[i].summary =
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
            summary: c.summary,
        }));
        result.degraded = degraded;
        timings.totalMs = Date.now() - start;
        return result;
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=SearchService.js.map