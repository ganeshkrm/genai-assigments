"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = estimateTokens;
exports.truncateToTokens = truncateToTokens;
exports.chatComplete = chatComplete;
const env_1 = require("../../config/env");
function providerConfig(provider) {
    switch (provider) {
        case "groq":
            return {
                url: "https://api.groq.com/openai/v1/chat/completions",
                apiKey: env_1.env.GROQ_API_KEY,
            };
        case "nvidia":
            return {
                url: env_1.env.NVIDIA_BASE_URL.replace(/\/?$/, "/") + "chat/completions",
                apiKey: env_1.env.NVIDIA_API_KEY,
            };
        default:
            return null;
    }
}
/** Rough token estimate (~4 chars/token). */
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
/** Truncate text to fit a token budget (no-op if already within budget). */
function truncateToTokens(text, maxTokens) {
    const maxChars = Math.max(0, maxTokens) * 4;
    return text.length > maxChars ? text.slice(0, maxChars) : text;
}
/**
 * Call the LLM, trying each step in the chain until one succeeds. Returns the
 * successful step's content plus which provider/model served it. Throws only
 * when every step fails.
 */
async function chatComplete(chain, messages, opts = {}) {
    let lastError = "no providers attempted";
    for (const step of chain) {
        const cfg = providerConfig(step.provider);
        if (!cfg || !cfg.apiKey) {
            lastError = `${step.provider}: not configured`;
            continue;
        }
        const body = {
            model: step.model,
            temperature: 0,
            messages,
        };
        if (opts.json)
            body.response_format = { type: "json_object" };
        if (opts.maxTokens)
            body.max_completion_tokens = opts.maxTokens;
        try {
            const res = await fetch(cfg.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cfg.apiKey}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                // 404 (bad model/provider), 429 (rate limit), 5xx -> try next step.
                lastError = `${step.provider}/${step.model} -> HTTP ${res.status}`;
                continue;
            }
            const data = (await res.json());
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                lastError = `${step.provider}/${step.model} -> empty response`;
                continue;
            }
            return { content, provider: step.provider, model: step.model };
        }
        catch (err) {
            lastError = `${step.provider}/${step.model} -> ${err.message}`;
            continue;
        }
    }
    throw new Error(`All LLM providers failed: ${lastError}`);
}
//# sourceMappingURL=LlmProvider.js.map