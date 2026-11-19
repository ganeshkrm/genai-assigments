import { searchApi } from "@/lib/api/search.api";
import { useSearchStore } from "@/lib/stores/search.store";
import { useChatStore } from "@/lib/stores/chat.store";
import { useCandidateStore } from "@/lib/stores/candidate.store";
import { ResultsList } from "@/components/features/results/ResultsList";

/**
 * useSearch — submit a query against the real backend (mode-aware), push the
 * user bubble + a bot bubble containing the ranked ResultsList. Clicking a
 * result opens the candidate modal via the candidate store.
 */
export function useSearch() {
  const searchType = useSearchStore((s) => s.searchType);
  const topK = useSearchStore((s) => s.topK);
  const setSearching = useSearchStore((s) => s.setSearching);
  const setResults = useSearchStore((s) => s.setResults);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addBotMessage = useChatStore((s) => s.addBotMessage);
  const openCandidate = useCandidateStore((s) => s.open);

  async function submitQuery(query: string) {
    const q = query.trim();
    if (!q) return;

    addUserMessage(q);
    setSearching(true);
    const t0 = performance.now();

    try {
      const outcome = await searchApi.searchResumes({
        mode: searchType,
        query: q,
        topK,
      });
      const duration = Math.round(performance.now() - t0);
      setResults(outcome.results, q);
      addBotMessage(
        <ResultsList
          results={outcome.results}
          searchType={searchType}
          duration={duration}
          timings={outcome.timings}
          degraded={outcome.degraded}
          warnings={outcome.warnings}
          mergedCount={outcome.mergedCount}
          onSelect={openCandidate}
        />
      );
    } catch {
      addBotMessage(
        <p className="text-red-400">Search failed. Please try again.</p>
      );
    } finally {
      setSearching(false);
    }
  }

  return { submitQuery };
}
