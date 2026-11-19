import { SearchCandidate } from "../types/retrieval.types";

/**
 * Merge + deduplicate candidates by resumeId (Phase 9) into one pool for LLM
 * re-ranking.
 *
 * - Dedup key: resumeId.
 * - Source provenance is preserved and unioned (e.g. ["bm25","vector"]).
 * - Both bm25Score and vectorScore are retained when a resume appears in both
 *   lists (scores are not combined into one number).
 * - Metadata/snippet are filled from the first list that provides them.
 *
 * Snippets are already size-controlled (capped at 400 chars by the repository
 * projection) before they reach the LLM.
 */
export function deduplicateCandidates(
  ...lists: SearchCandidate[][]
): SearchCandidate[] {
  const byId = new Map<string, SearchCandidate>();

  for (const list of lists) {
    for (const candidate of list) {
      const existing = byId.get(candidate.resumeId);

      if (!existing) {
        byId.set(candidate.resumeId, {
          ...candidate,
          sources: [...candidate.sources],
        });
        continue;
      }

      // Merge into the existing pooled candidate.
      existing.sources = Array.from(
        new Set([...existing.sources, ...candidate.sources])
      );

      if (candidate.bm25Score !== undefined) {
        existing.bm25Score =
          existing.bm25Score !== undefined
            ? Math.max(existing.bm25Score, candidate.bm25Score)
            : candidate.bm25Score;
      }
      if (candidate.vectorScore !== undefined) {
        existing.vectorScore =
          existing.vectorScore !== undefined
            ? Math.max(existing.vectorScore, candidate.vectorScore)
            : candidate.vectorScore;
      }

      existing.name = existing.name ?? candidate.name;
      existing.role = existing.role ?? candidate.role;
      existing.company = existing.company ?? candidate.company;
      existing.skills = existing.skills ?? candidate.skills;
      existing.totalExperience =
        existing.totalExperience ?? candidate.totalExperience;
      existing.snippet = existing.snippet ?? candidate.snippet;
    }
  }

  return Array.from(byId.values());
}
