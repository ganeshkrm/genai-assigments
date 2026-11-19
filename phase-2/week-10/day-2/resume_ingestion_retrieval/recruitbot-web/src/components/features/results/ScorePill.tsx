import { cn } from "@/lib/utils";
import { formatScore } from "@/lib/utils/formatters";
import type { SearchMode } from "@/types/search.types";

/** Per-mode score label + colour. */
const MODE_SCORE: Record<SearchMode, { label: string; className: string }> = {
  vector: { label: "Similarity", className: "text-score-vector bg-score-vector/10" },
  bm25: { label: "BM25", className: "text-score-bm25 bg-score-bm25/10" },
  hybrid: { label: "Relevance", className: "text-score-hybrid bg-score-hybrid/10" },
};

interface ScorePillProps {
  score: number | undefined;
  searchType: SearchMode;
}

export function ScorePill({ score, searchType }: ScorePillProps) {
  const meta = MODE_SCORE[searchType];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        meta.className
      )}
      title={`${meta.label} score`}
    >
      {formatScore(score)}
      <span className="font-normal opacity-70">{meta.label}</span>
    </span>
  );
}

export default ScorePill;
