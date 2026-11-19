import { ResultSummary } from "./ResultSummary";
import { ResultCard } from "./ResultCard";
import { EmptyState } from "@/components/common/EmptyState";
import type {
  RetrievalResult,
  SearchMode,
  SearchTimings,
} from "@/types/search.types";

/**
 * ResultsList — summary header (+ pipeline badges for Smart Search) and the
 * ranked ResultCard list (or EmptyState). Rendered inside a BotBubble.
 */
interface ResultsListProps {
  results: RetrievalResult[];
  searchType: SearchMode;
  duration: number;
  timings?: SearchTimings;
  degraded?: boolean;
  warnings?: string[];
  mergedCount?: number;
  onSelect: (resumeId: string) => void;
}

export function ResultsList({
  results,
  searchType,
  duration,
  timings,
  degraded,
  warnings,
  mergedCount,
  onSelect,
}: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <ResultSummary
          count={0}
          searchType={searchType}
          duration={duration}
          timings={timings}
          degraded={degraded}
          warnings={warnings}
          mergedCount={mergedCount}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ResultSummary
        count={results.length}
        searchType={searchType}
        duration={duration}
        timings={timings}
        degraded={degraded}
        warnings={warnings}
        mergedCount={mergedCount}
      />
      <div className="flex flex-col gap-2.5">
        {results.map((r, i) => (
          <ResultCard
            key={r.resumeId}
            result={r}
            rank={r.rank ?? i + 1}
            searchType={searchType}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default ResultsList;
