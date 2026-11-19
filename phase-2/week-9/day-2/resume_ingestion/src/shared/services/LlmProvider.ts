import { env } from "../../config/env";

/**
 * Provider-aware LLM chat client with a fallback chain and token budgeting
 * (deferred multi-provider work).
 *
 * Supports OpenAI-compatible providers only (groq, nvidia). The active chain is
 * configured in env; non-OpenAI-compatible providers (gemini/anthropic) are not
 * implemented. Default behavior is unchanged: the primary step is tried first,
 * and fallback steps run ONLY when the primary fails (404/429/5xx/network).
 */
interface ProviderConfig {
  url: string;
  apiKey: string;
}

export interface LlmStep {
  provider: string;
  model: string;
}

interface ChatOpts {
  json?: boolean;
  maxTokens?: number;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function providerConfig(provider: string): ProviderConfig | null {
  switch (provider) {
    case "groq":
      return {
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: env.GROQ_API_KEY,
      };
    case "nvidia":
      return {
        url: env.NVIDIA_BASE_URL.replace(/\/?$/, "/") + "chat/completions",
        apiKey: env.NVIDIA_API_KEY,
      };
    default:
      return null;
  }
}

/** Rough token estimate (~4 chars/token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Truncate text to fit a token budget (no-op if already within budget). */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = Math.max(0, maxTokens) * 4;
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

/**
 * Call the LLM, trying each step in the chain until one succeeds. Returns the
 * successful step's content plus which provider/model served it. Throws only
 * when every step fails.
 */
export async function chatComplete(
  chain: LlmStep[],
  messages: Array<{ role: string; content: string }>,
  opts: ChatOpts = {}
): Promise<{ content: string; provider: string; model: string }> {
  let lastError = "no providers attempted";

  for (const step of chain) {
    const cfg = providerConfig(step.provider);
    if (!cfg || !cfg.apiKey) {
      lastError = `${step.provider}: not configured`;
      continue;
    }

    const body: Record<string, unknown> = {
      model: step.model,
      temperature: 0,
      messages,
    };
    if (opts.json) body.response_format = { type: "json_object" };
    if (opts.maxTokens) body.max_completion_tokens = opts.maxTokens;

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
      const data = (await res.json()) as ChatResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        lastError = `${step.provider}/${step.model} -> empty response`;
        continue;
      }
      return { content, provider: step.provider, model: step.model };
    } catch (err) {
      lastError = `${step.provider}/${step.model} -> ${(err as Error).message}`;
      continue;
    }
  }

  throw new Error(`All LLM providers failed: ${lastError}`);
}
