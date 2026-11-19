"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const env_1 = require("../../../config/env");
const LlmProvider_1 = require("../../../shared/services/LlmProvider");
class LLMService {
    /** Build a [primary, fallback?] chain for a task. */
    chain(provider, model) {
        const chain = [{ provider, model }];
        if (env_1.env.ENABLE_FALLBACK &&
            !(env_1.env.LLM_FALLBACK_PROVIDER === provider &&
                env_1.env.LLM_FALLBACK_MODEL === model)) {
            chain.push({
                provider: env_1.env.LLM_FALLBACK_PROVIDER,
                model: env_1.env.LLM_FALLBACK_MODEL,
            });
        }
        return chain;
    }
    /** Apply the input token budget to a user message, if enabled. */
    budgetInput(text, reserveForOutput) {
        if (!env_1.env.ENABLE_TOKEN_OPTIMIZATION)
            return text;
        return (0, LlmProvider_1.truncateToTokens)(text, Math.max(500, env_1.env.MAX_TOTAL_TOKENS - reserveForOutput));
    }
    /**
     * Re-rank candidates by relevance to the query. The LLM is the final ranking
     * authority. Output is schema-validated: only input resumeIds are kept (no
     * hallucinated candidate), limited to topN.
     */
    async rerankCandidates(query, candidates, topN) {
        if (candidates.length === 0)
            return [];
        const allowedIds = new Set(candidates.map((c) => c.resumeId));
        const candidateBlock = candidates
            .map((c, i) => {
            const skills = (c.skills ?? []).join(", ");
            const snippet = (c.snippet ?? "").slice(0, 400);
            return `${i + 1}. resumeId=${c.resumeId}\n   role: ${c.role ?? "-"}\n   skills: ${skills}\n   snippet: ${snippet}`;
        })
            .join("\n");
        const system = "You are a precise recruiting re-ranker. Rank the provided candidates by " +
            "how well they match the search query. Use ONLY the candidates given; " +
            "never invent a resumeId. Respond with a single JSON object only: " +
            '{"results":[{"resumeId":string,"rank":number,"relevanceScore":number (0..1),"reason":string}]}. ' +
            `Return at most ${topN} candidates, best first (rank 1 = best).`;
        const user = this.budgetInput(`Query: ${query}\n\nCandidates:\n${candidateBlock}`, env_1.env.MAX_GENERATION_TOKENS);
        const { content } = await (0, LlmProvider_1.chatComplete)(this.chain(env_1.env.RERANK_PROVIDER, env_1.env.RERANK_MODEL), [
            { role: "system", content: system },
            { role: "user", content: user },
        ], {
            json: true,
            maxTokens: env_1.env.ENABLE_TOKEN_OPTIMIZATION
                ? env_1.env.MAX_GENERATION_TOKENS
                : undefined,
        });
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch {
            throw new Error("LLM re-rank did not return valid JSON");
        }
        const rawResults = parsed?.results;
        if (!Array.isArray(rawResults)) {
            throw new Error("LLM re-rank JSON missing results array");
        }
        const results = [];
        for (const r of rawResults) {
            const row = r;
            const resumeId = typeof row.resumeId === "string" ? row.resumeId : null;
            // Drop any hallucinated id not present in the input.
            if (!resumeId || !allowedIds.has(resumeId))
                continue;
            results.push({
                resumeId,
                rank: typeof row.rank === "number" ? row.rank : results.length + 1,
                relevanceScore: typeof row.relevanceScore === "number" ? row.relevanceScore : 0,
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
    async summarizeCandidateFit(query, candidate, options = {}) {
        const style = options.style === "detailed" ? "detailed" : "short";
        const maxTokens = options.maxTokens ?? (style === "detailed" ? 400 : 150);
        const system = "You summarize a candidate's fit for a search query. Use ONLY the " +
            "candidate information provided; do not invent facts. " +
            (style === "detailed"
                ? "Write 3-5 sentences."
                : "Write 1-2 concise sentences.");
        const user = `Query: ${query}\n\nCandidate:\n` +
            `role: ${candidate.role ?? "-"}\n` +
            `skills: ${(candidate.skills ?? []).join(", ")}\n` +
            `snippet: ${(candidate.snippet ?? "").slice(0, 600)}`;
        const budgetedMaxTokens = env_1.env.ENABLE_TOKEN_OPTIMIZATION
            ? Math.min(maxTokens, env_1.env.MAX_SUMMARY_TOKENS)
            : maxTokens;
        const { content } = await (0, LlmProvider_1.chatComplete)(this.chain(env_1.env.SUMMARIZATION_PROVIDER, env_1.env.SUMMARIZATION_MODEL), [
            { role: "system", content: system },
            { role: "user", content: this.budgetInput(user, budgetedMaxTokens) },
        ], { maxTokens: budgetedMaxTokens });
        return content.trim();
    }
    /**
     * Optional query-time metadata extraction from raw text. Ingestion metadata
     * remains the stored source of truth; this is a convenience helper.
     */
    async extractMetadata(rawText) {
        const { content } = await (0, LlmProvider_1.chatComplete)(this.chain(env_1.env.RERANK_PROVIDER, env_1.env.RERANK_MODEL), [
            {
                role: "system",
                content: "Extract resume metadata as a JSON object with keys name, skills " +
                    "(array), totalExperience (number|null). Respond with JSON only.",
            },
            { role: "user", content: rawText.slice(0, 4000) },
        ], {
            json: true,
            maxTokens: env_1.env.ENABLE_TOKEN_OPTIMIZATION
                ? env_1.env.MAX_GENERATION_TOKENS
                : undefined,
        });
        try {
            return JSON.parse(content);
        }
        catch {
            throw new Error("LLM metadata extraction returned invalid JSON");
        }
    }
}
exports.LLMService = LLMService;
//# sourceMappingURL=LLMService.js.map