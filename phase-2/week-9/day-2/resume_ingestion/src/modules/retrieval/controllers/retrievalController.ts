import { Request, Response, NextFunction } from "express";
import { RetrievalValidationService } from "../services/RetrievalValidationService";
import { EmbeddingService } from "../../../shared/services/EmbeddingService";
import { ResumeRepository } from "../repositories/ResumeRepository";
import { SearchService } from "../services/SearchService";
import { LLMService } from "../services/LLMService";
import { SearchCandidate } from "../types/retrieval.types";
import { AppError, IngestionErrors } from "../../../middleware/errorHandler";
import { env } from "../../../config/env";

const retrievalValidationService = new RetrievalValidationService();
const embeddingService = new EmbeddingService();
const resumeRepository = new ResumeRepository();
const searchService = new SearchService();
const llmService = new LLMService();

/** Which of the candidate's skills are referenced by the query (token-aware). */
function matchedSkills(query: string, skills: string[]): string[] {
  const q = query.toLowerCase();
  return (skills || []).filter((skill) => {
    const skillLc = skill.toLowerCase();
    if (q.includes(skillLc)) return true;
    // Fall back to the skill's leading token (e.g. "MCP" from
    // "MCP (Model Context Protocol)").
    const firstToken = skill
      .replace(/\(.*?\)/g, "")
      .trim()
      .split(/\s+/)[0]
      .toLowerCase();
    return (
      firstToken.length >= 2 &&
      new RegExp(`\\b${firstToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(q)
    );
  });
}

/** Clamp a requested topK to a sane range, defaulting to the configured value. */
function resolveTopK(requested: unknown): number {
  const k =
    typeof requested === "number" && requested > 0
      ? requested
      : env.RETRIEVAL_DEFAULT_TOP_K;
  return Math.min(k, 100);
}

const MAX_QUERY_LENGTH = 2000;

/**
 * Validate + trim a search query (Phase 17). Throws INVALID_SEARCH_QUERY for a
 * missing/empty/oversized query.
 */
function validateQuery(query: unknown): string {
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new AppError(400, "INVALID_SEARCH_QUERY", "Search query is required");
  }
  const trimmed = query.trim();
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new AppError(
      400,
      "INVALID_SEARCH_QUERY",
      `Search query exceeds maximum length of ${MAX_QUERY_LENGTH}`
    );
  }
  return trimmed;
}

/** Validate filters (Phase 17). */
function validateFilters(filters: unknown): { minYearsExperience?: number } {
  if (filters === undefined || filters === null) return {};
  if (typeof filters !== "object") {
    throw new AppError(400, "INVALID_SEARCH_QUERY", "filters must be an object");
  }
  const f = filters as Record<string, unknown>;
  const out: { minYearsExperience?: number } = {};
  if (f.minYearsExperience !== undefined) {
    if (typeof f.minYearsExperience !== "number" || f.minYearsExperience < 0) {
      throw new AppError(
        400,
        "INVALID_SEARCH_QUERY",
        "minYearsExperience must be a non-negative number"
      );
    }
    out.minYearsExperience = f.minYearsExperience;
  }
  return out;
}

/** Normalize + cap the search options (Phase 17). */
function normalizeOptions(options: unknown): {
  bm25TopK: number;
  vectorTopK: number;
  rerankTopN: number;
  finalTopK: number;
  summarize: boolean;
  summaryStyle: "short" | "detailed";
} {
  const o = (options && typeof options === "object" ? options : {}) as Record<
    string,
    unknown
  >;
  const cap = (v: unknown, def: number, max: number): number => {
    const n = typeof v === "number" && v > 0 ? v : def;
    return Math.min(n, max);
  };
  if (
    o.summaryStyle !== undefined &&
    o.summaryStyle !== "short" &&
    o.summaryStyle !== "detailed"
  ) {
    throw new AppError(
      400,
      "INVALID_SEARCH_QUERY",
      "summaryStyle must be 'short' or 'detailed'"
    );
  }
  return {
    bm25TopK: cap(o.bm25TopK, env.RETRIEVAL_DEFAULT_TOP_K, 100),
    vectorTopK: cap(o.vectorTopK, env.RETRIEVAL_DEFAULT_TOP_K, 100),
    rerankTopN: cap(o.rerankTopN, env.RERANK_DEFAULT_TOP_N, 50),
    finalTopK: cap(o.finalTopK, 5, 50),
    summarize: o.summarize === true,
    summaryStyle: o.summaryStyle === "detailed" ? "detailed" : "short",
  };
}

/**
 * Retrieval controller.
 *
 * Phase 1 exposes only the readiness check. Search handlers are added in
 * later phases.
 */
export const retrievalController = {
  /**
   * GET /v1/search/readiness — retrieval readiness check (Phase 1).
   * 200 when ready; 503 when no ingested resume embeddings are available.
   */
  async readiness(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await retrievalValidationService.checkReadiness();
      res.status(result.ready ? 200 : 503).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /v1/embeddings — generate a Mistral embedding for a search query
   * on demand (Phase 3). Reuses the shared EmbeddingService. Does not touch
   * or regenerate any stored resume embedding.
   * Body: { model?: string, input: string }
   */
  async embeddings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { input } = req.body ?? {};

    if (typeof input !== "string" || input.trim().length === 0) {
      next(
        IngestionErrors.validation("input is required and must be a string")
      );
      return;
    }

    try {
      const embedding = await embeddingService.generateEmbedding(input);
      res.status(200).json({
        embedding,
        model: env.MISTRAL_EMBED_MODEL,
        dimension: embedding.length,
      });
    } catch (_err) {
      next(IngestionErrors.embeddingFailed());
    }
  },

  /**
   * POST /v1/search/bm25 — lexical (BM25) search over resume text + metadata
   * (Phase 5). Does not call the LLM.
   * Body: { query, topK?, filters?: { minYearsExperience? } }
   */
  async bm25(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { query, topK, filters } = req.body ?? {};

    if (typeof query !== "string" || query.trim().length === 0) {
      next(new AppError(400, "INVALID_SEARCH_QUERY", "Search query is required"));
      return;
    }

    const k = resolveTopK(topK);
    const minYears =
      filters && typeof filters.minYearsExperience === "number"
        ? filters.minYearsExperience
        : undefined;

    try {
      const docs = await resumeRepository.bm25Search(query.trim(), minYears, k);
      const results = docs.map((d) => ({
        resumeId: d._id.toString(),
        name: d.name ?? null,
        role: d.role ?? null,
        score: Math.round((d.score ?? 0) * 100) / 100,
        matchedSkills: matchedSkills(query, d.skills ?? []),
      }));

      res.status(200).json({
        mode: "bm25",
        query: query.trim(),
        count: results.length,
        results,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /v1/search/vector — semantic vector search (Phase 6).
   * Embeds the query on demand (Mistral), then runs Atlas Vector Search.
   * Body: { query, topK? }
   */
  async vector(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { query, topK } = req.body ?? {};

    if (typeof query !== "string" || query.trim().length === 0) {
      next(new AppError(400, "INVALID_SEARCH_QUERY", "Search query is required"));
      return;
    }

    const k = resolveTopK(topK);

    // 1. Generate the query embedding (same model/dimension as stored resumes).
    let queryVector: number[];
    try {
      queryVector = await embeddingService.generateEmbedding(query.trim());
    } catch (_err) {
      next(IngestionErrors.embeddingFailed());
      return;
    }

    // 2. Vector search (controlled failure if Atlas Vector Search errors).
    try {
      const docs = await resumeRepository.vectorSearch(queryVector, k);
      const results = docs.map((d) => ({
        resumeId: d._id.toString(),
        name: d.name ?? null,
        role: d.role ?? null,
        vectorScore: Math.round((d.vectorScore ?? 0) * 100) / 100,
      }));

      res.status(200).json({
        mode: "vector",
        query: query.trim(),
        count: results.length,
        results,
      });
    } catch (_err) {
      next(new AppError(502, "VECTOR_SEARCH_FAILED", "Vector search failed"));
    }
  },

  /**
   * POST /v1/search/hybrid — run BM25 and vector search in parallel and return
   * both ranked lists separately (Phase 8). Scores are not merged.
   * Body: { query, topK?, filters?: { minYearsExperience? } }
   */
  async hybrid(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { query, topK, filters } = req.body ?? {};

    if (typeof query !== "string" || query.trim().length === 0) {
      next(new AppError(400, "INVALID_SEARCH_QUERY", "Search query is required"));
      return;
    }

    const k = resolveTopK(topK);

    try {
      const { bm25, vector, timings } = await searchService.hybridSearch(
        query.trim(),
        filters ?? {},
        k
      );

      res.locals.logContext = { ...timings };

      res.status(200).json({
        mode: "hybrid-debug",
        bm25: bm25.map((c) => ({
          resumeId: c.resumeId,
          name: c.name ?? null,
          score: c.bm25Score ?? null,
        })),
        vector: vector.map((c) => ({
          resumeId: c.resumeId,
          name: c.name ?? null,
          score: c.vectorScore ?? null,
        })),
        timings,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /v1/search/rerank — LLM re-ranking of supplied candidates (Phase 11).
   * Returned ids are always a subset of the input (no hallucination).
   * Body: { query, candidates: [{ resumeId, snippet? }], topK? }
   */
  async rerank(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { query, candidates, topK } = req.body ?? {};

    if (typeof query !== "string" || query.trim().length === 0) {
      next(new AppError(400, "INVALID_SEARCH_QUERY", "Search query is required"));
      return;
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
      next(IngestionErrors.validation("candidates must be a non-empty array"));
      return;
    }

    const mapped: SearchCandidate[] = [];
    for (const c of candidates) {
      if (!c || typeof c.resumeId !== "string") {
        next(IngestionErrors.validation("each candidate requires a resumeId"));
        return;
      }
      mapped.push({
        resumeId: c.resumeId,
        snippet: typeof c.snippet === "string" ? c.snippet : undefined,
        role: typeof c.role === "string" ? c.role : undefined,
        skills: Array.isArray(c.skills) ? c.skills : undefined,
        sources: [],
      });
    }

    const topN =
      typeof topK === "number" && topK > 0
        ? Math.min(topK, 50)
        : env.RERANK_DEFAULT_TOP_N;

    try {
      const results = await llmService.rerankCandidates(
        query.trim(),
        mapped,
        topN
      );
      res.status(200).json({ results, model: env.RERANK_MODEL });
    } catch (_err) {
      next(new AppError(502, "LLM_RERANK_FAILED", "LLM re-ranking failed"));
    }
  },

  /**
   * POST /v1/search/summarize — optional candidate-fit summary (Phase 12).
   * Grounded only in the supplied candidate data.
   * Body: { query, candidate: { resumeId, snippet?, role?, skills? }, style?, maxTokens? }
   */
  async summarize(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { query, candidate, style, maxTokens } = req.body ?? {};

    if (typeof query !== "string" || query.trim().length === 0) {
      next(new AppError(400, "INVALID_SEARCH_QUERY", "Search query is required"));
      return;
    }
    if (!candidate || typeof candidate.resumeId !== "string") {
      next(
        IngestionErrors.validation("candidate with a resumeId is required")
      );
      return;
    }
    if (style !== undefined && style !== "short" && style !== "detailed") {
      next(IngestionErrors.validation("style must be 'short' or 'detailed'"));
      return;
    }

    const mapped: SearchCandidate = {
      resumeId: candidate.resumeId,
      snippet: typeof candidate.snippet === "string" ? candidate.snippet : undefined,
      role: typeof candidate.role === "string" ? candidate.role : undefined,
      skills: Array.isArray(candidate.skills) ? candidate.skills : undefined,
      sources: [],
    };

    try {
      const summary = await llmService.summarizeCandidateFit(
        query.trim(),
        mapped,
        {
          style: style === "detailed" ? "detailed" : "short",
          maxTokens: typeof maxTokens === "number" ? maxTokens : undefined,
        }
      );
      res.status(200).json({ resumeId: mapped.resumeId, summary });
    } catch (_err) {
      next(new AppError(502, "SUMMARIZATION_FAILED", "Summarization failed"));
    }
  },

  /**
   * POST /v1/search — full synchronous search pipeline (Phase 14) with
   * graceful fallbacks (Phase 15), validation (Phase 17) and component-timing
   * logging (Phase 16).
   * Body: { query, filters?, options? }
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    let query: string;
    let filters: { minYearsExperience?: number };
    let options: ReturnType<typeof normalizeOptions>;
    try {
      query = validateQuery(req.body?.query);
      filters = validateFilters(req.body?.filters);
      options = normalizeOptions(req.body?.options);
    } catch (err) {
      next(err);
      return;
    }

    try {
      const r = await searchService.endToEndSearch(query, filters, options);

      // Structured component timings for the request logger (Phase 16).
      res.locals.logContext = {
        componentTimings: {
          embeddingMs: r.timings.embeddingMs,
          bm25Ms: r.timings.bm25Ms,
          vectorMs: r.timings.vectorMs,
          rerankMs: r.timings.rerankMs,
          summarizeMs: r.timings.summarizeMs,
        },
        degraded: r.degraded,
        warnings: r.warnings,
        totalMs: r.timings.totalMs,
      };

      res.status(200).json({
        query,
        results: r.results,
        degraded: r.degraded,
        warnings: r.warnings,
        ...(r.vectorFallback ? { vectorFallback: true } : {}),
        ...(r.bm25Fallback ? { bm25Fallback: true } : {}),
        timings: r.timings,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /v1/candidate/:id — read-only full candidate profile for the UI modal.
   *
   * Additive endpoint (frontend support): reads one stored resume document by
   * id and maps it to a profile shape. It does not alter any ingestion or
   * search logic. The large embedding vector is excluded.
   */
  async candidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    try {
      const doc = await resumeRepository.findById(id);
      if (!doc) {
        next(
          new AppError(404, "CANDIDATE_NOT_FOUND", "Candidate not found")
        );
        return;
      }

      // Normalise the stored `education` field into an array for the UI.
      const toEducationArray = (
        edu: unknown
      ): Array<{ degree: string; institution: string; year?: string }> => {
        if (!edu) return [];
        if (Array.isArray(edu)) {
          return edu.map((e) =>
            typeof e === "string"
              ? { degree: e, institution: "" }
              : {
                  degree: (e?.degree as string) ?? "",
                  institution: (e?.institution as string) ?? "",
                  year: e?.year as string | undefined,
                }
          );
        }
        if (typeof edu === "string") return [{ degree: edu, institution: "" }];
        return [];
      };

      res.status(200).json({
        _id: doc._id.toString(),
        name: doc.name ?? null,
        email: doc.email ?? null,
        phoneNumber: doc.phone ?? null,
        location: doc.location ?? null,
        title: doc.role ?? null,
        company: doc.company ?? null,
        skills: Array.isArray(doc.skills) ? doc.skills : [],
        education: toEducationArray(doc.education),
        totalExperience: doc.totalExperience ?? null,
        experienceSummary: doc.experienceSummary ?? null,
        jobTitles: Array.isArray(doc.jobTitles) ? doc.jobTitles : [],
        text: doc.experienceSummary ?? null,
        processedAt: doc.createdAt ?? null,
      });
    } catch (err) {
      next(err);
    }
  },
};
