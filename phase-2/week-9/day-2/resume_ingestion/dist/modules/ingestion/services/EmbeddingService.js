"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const env_1 = require("../../../config/env");
/**
 * Generates Mistral embeddings for resume text (Phase 11).
 *
 * Uses the `mistral-embed` model (expected dimension 1024). The embedding is
 * generated during ingestion, before the final record is stored, which is the
 * handoff that makes later vector retrieval possible.
 *
 * A shared version may later move to src/shared/services/EmbeddingService.ts
 * so retrieval can reuse the same Mistral client.
 */
const MISTRAL_EMBEDDINGS_URL = "https://api.mistral.ai/v1/embeddings";
class EmbeddingService {
    /**
     * Build the embedding input text from structured resume fields, following
     * the architecture's template (name, role, skills, company, summary, raw).
     */
    buildEmbeddingInput(fields) {
        const { name, role, skills, company, experienceSummary, rawText } = fields;
        return `
${name ?? ""}
${role ?? ""}
${(skills ?? []).join(", ")}
${company ?? ""}
${experienceSummary ?? ""}
${rawText}
`;
    }
    /**
     * Generate a Mistral embedding for the given text. Returns the numeric
     * vector. Retries transient failures (HTTP 429 / 5xx / network errors) with
     * exponential backoff (honoring Retry-After) so bulk ingestion is resilient.
     * Non-transient errors (4xx other than 429, invalid vector) throw immediately.
     */
    async generateEmbedding(text) {
        if (!env_1.env.MISTRAL_API_KEY) {
            throw new Error("MISTRAL_API_KEY is not configured");
        }
        const maxAttempts = Math.max(1, parseInt(process.env.EMBED_MAX_ATTEMPTS || "4", 10));
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            let response;
            try {
                response = await fetch(MISTRAL_EMBEDDINGS_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${env_1.env.MISTRAL_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: env_1.env.MISTRAL_EMBED_MODEL,
                        input: [text],
                    }),
                });
            }
            catch (networkErr) {
                // Network/timeout error — transient; retry if attempts remain.
                if (attempt < maxAttempts) {
                    await this.sleep(this.backoffMs(attempt));
                    continue;
                }
                throw networkErr;
            }
            if (response.ok) {
                const data = (await response.json());
                const embedding = data.data?.[0]?.embedding;
                if (!Array.isArray(embedding) ||
                    embedding.length === 0 ||
                    !embedding.every((n) => typeof n === "number" && !Number.isNaN(n))) {
                    throw new Error("Mistral returned an invalid embedding vector");
                }
                return embedding;
            }
            // Retry transient server/rate-limit responses.
            const transient = response.status === 429 || response.status >= 500;
            if (transient && attempt < maxAttempts) {
                const retryAfter = parseFloat(response.headers.get("retry-after") || "");
                const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
                    ? retryAfter * 1000
                    : this.backoffMs(attempt);
                await this.sleep(waitMs);
                continue;
            }
            throw new Error(`Mistral API error: ${response.status}`);
        }
        throw new Error("Mistral API: retries exhausted");
    }
    backoffMs(attempt) {
        return Math.min(300 * 2 ** (attempt - 1), 4000);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.EmbeddingService = EmbeddingService;
//# sourceMappingURL=EmbeddingService.js.map