import { RerankResult, SearchCandidate } from "../types/retrieval.types";
import { env } from "../../../config/env";
import {
  chatComplete,
  truncateToTokens,
  LlmStep,
} from "../../../shared/services/LlmProvider";

/**
 * LLM service for retrieval (Phase 10): re-ranking and summarization.
 *
 * Uses a provider-aware chat client (OpenAI-compatible: groq/nvidia) with a
 * configurable fallback chain and token budgeting. Default path is unchanged
 * (primary Groq model); fallback runs only when the primary fails.
 */
export interface SummarizeOptions {
  style?: "short" | "detailed";
  maxTokens?: number;
}

export class LLMService {
  /** Build a [primary, fallback?] chain for a task. */
  private chain(provider: string, model: string): LlmStep[] {
    const chain: LlmStep[] = [{ provider, model }];
    if (
      env.ENABLE_FALLBACK &&
      !(
        env.LLM_FALLBACK_PROVIDER === provider &&
        env.LLM_FALLBACK_MODEL === model
      )
    ) {
      chain.push({
        provider: env.LLM_FALLBACK_PROVIDER,
        model: env.LLM_FALLBACK_MODEL,
      });
    }
    return chain;
  }

  /** Apply the input token budget to a user message, if enabled. */
  private budgetInput(text: string, reserveForOutput: number): string {
    if (!env.ENABLE_TOKEN_OPTIMIZATION) return text;
    return truncateToTokens(
      text,
      Math.max(500, env.MAX_TOTAL_TOKENS - reserveForOutput)
    );
  }

  /**
   * Re-rank candidates by relevance to the query. The LLM is the final ranking
   * authority. Output is schema-validated: only input resumeIds are kept (no
   * hallucinated candidate), limited to topN.
   */
  async rerankCandidates(
    query: string,
    candidates: SearchCandidate[],
    topN: number
  ): Promise<RerankResult[]> {
    if (candidates.length === 0) return [];

    const allowedIds = new Set(candidates.map((c) => c.resumeId));

    const candidateBlock = candidates
      .map((c, i) => {
        const skills = (c.skills ?? []).join(", ");
        const snippet = (c.snippet ?? "").slice(0, 400);
        return `${i + 1}. resumeId=${c.resumeId}\n   role: ${c.role ?? "-"}\n   skills: ${skills}\n   snippet: ${snippet}`;
      })
      .join("\n");

    const system =
      "You are a precise recruiting re-ranker. Rank the provided candidates by " +
      "how well they match the search query. Use ONLY the candidates given; " +
      "never invent a resumeId. Respond with a single JSON object only: " +
      '{"results":[{"resumeId":string,"rank":number,"relevanceScore":number (0..1),"reason":string}]}. ' +
      `Return at most ${topN} candidates, best first (rank 1 = best).`;

    const user = this.budgetInput(
      `Query: ${query}\n\nCandidates:\n${candidateBlock}`,
      env.MAX_GENERATION_TOKENS
    );

    const { content } = await chatComplete(
      this.chain(env.RERANK_PROVIDER, env.RERANK_MODEL),
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      {
        json: true,
        maxTokens: env.ENABLE_TOKEN_OPTIMIZATION
          ? env.MAX_GENERATION_TOKENS
          : undefined,
      }
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("LLM re-rank did not return valid JSON");
    }

    const rawResults = (parsed as { results?: unknown })?.results;
    if (!Array.isArray(rawResults)) {
      throw new Error("LLM re-rank JSON missing results array");
    }

    const results: RerankResult[] = [];
    for (const r of rawResults) {
      const row = r as Record<string, unknown>;
      const resumeId = typeof row.resumeId === "string" ? row.resumeId : null;
      // Drop any hallucinated id not present in the input.
      if (!resumeId || !allowedIds.has(resumeId)) continue;
      results.push({
        resumeId,
        rank: typeof row.rank === "number" ? row.rank : results.length + 1,
        relevanceScore:
          typeof row.relevanceScore === "number" ? row.relevanceScore : 0,
        reason: typeof row.reason === "string" ? row.reason : undefined,
      });
    }

    results.sort((a, b) => a.rank - b.rank);
    return results.slice(0, topN);
  }

  /**
   * Summarize how a candidate fits the query. Grounded only in the supplied
   * candidate data (role/skills/snippet) — not instructed to invent.
   */
  async summarizeCandidateFit(
    query: string,
    candidate: SearchCandidate,
    options: SummarizeOptions = {}
  ): Promise<string> {
    const style = options.style === "detailed" ? "detailed" : "short";
    const maxTokens = options.maxTokens ?? (style === "detailed" ? 400 : 150);

    const system =
      "You summarize a candidate's fit for a search query. Use ONLY the " +
      "candidate information provided; do not invent facts. " +
      (style === "detailed"
        ? "Write 3-5 sentences."
        : "Write 1-2 concise sentences.");

    const user =
      `Query: ${query}\n\nCandidate:\n` +
      `role: ${candidate.role ?? "-"}\n` +
      `skills: ${(candidate.skills ?? []).join(", ")}\n` +
      `snippet: ${(candidate.snippet ?? "").slice(0, 600)}`;

    const budgetedMaxTokens = env.ENABLE_TOKEN_OPTIMIZATION
      ? Math.min(maxTokens, env.MAX_SUMMARY_TOKENS)
      : maxTokens;

    const { content } = await chatComplete(
      this.chain(env.SUMMARIZATION_PROVIDER, env.SUMMARIZATION_MODEL),
      [
        { role: "system", content: system },
        { role: "user", content: this.budgetInput(user, budgetedMaxTokens) },
      ],
      { maxTokens: budgetedMaxTokens }
    );
    return content.trim();
  }

  /**
   * Optional query-time metadata extraction from raw text. Ingestion metadata
   * remains the stored source of truth; this is a convenience helper.
   */
  async extractMetadata(rawText: string): Promise<unknown> {
    const { content } = await chatComplete(
      this.chain(env.RERANK_PROVIDER, env.RERANK_MODEL),
      [
        {
          role: "system",
          content:
            "Extract resume metadata as a JSON object with keys name, skills " +
            "(array), totalExperience (number|null). Respond with JSON only.",
        },
        { role: "user", content: rawText.slice(0, 4000) },
      ],
      {
        json: true,
        maxTokens: env.ENABLE_TOKEN_OPTIMIZATION
          ? env.MAX_GENERATION_TOKENS
          : undefined,
      }
    );
    try {
      return JSON.parse(content);
    } catch {
      throw new Error("LLM metadata extraction returned invalid JSON");
    }
  }
}
