import { ParsedResume } from "../types/ingestion.types";
import { env } from "../../../config/env";
import { AlgorithmResumeParser } from "./AlgorithmResumeParser";
import { LLMResumeParser } from "./LLMResumeParser";

/**
 * Configuration-driven parser selection (Phase 10).
 *
 * Returns a unified async parser based on USE_LLM_PARSER, without replacing
 * the deterministic parser architecture. The deterministic path requires no
 * LLM key; the LLM path is enabled purely by configuration.
 */
export interface ActiveResumeParser {
  mode: "llm" | "algorithm";
  parse(rawText: string): Promise<ParsedResume>;
}

export function createResumeParser(): ActiveResumeParser {
  if (env.USE_LLM_PARSER) {
    const llm = new LLMResumeParser();
    return {
      mode: "llm",
      parse: (rawText: string) => llm.parseResume(rawText),
    };
  }

  const algorithm = new AlgorithmResumeParser();
  return {
    mode: "algorithm",
    parse: (rawText: string) => Promise.resolve(algorithm.parseResume(rawText)),
  };
}
