import { AlertTriangle, Layers, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchMode, SearchTimings } from "@/types/search.types";

const MODE_LABEL: Record<SearchMode, { text: string; badge: string }> = {
  vector: { text: "Vector (raw)", badge: "bg-score-vector/20 text-score-vector" },
  bm25: { text: "Keyword (raw)", badge: "bg-score-bm25/20 text-score-bm25" },
  hybrid: { text: "Smart Search", badge: "bg-score-hybrid/20 text-score-hybrid" },
};

interface ResultSummaryProps {
  count: number;
  searchType: SearchMode;
  duration: number;
  timings?: SearchTimings;
  degraded?: boolean;
  warnings?: string[];
  mergedCount?: number;
}

/** Header above the result list: count · mode · time, plus pipeline badges. */
export function ResultSummary({
  count,
  searchType,
  duration,
  timings,
  degraded,
  warnings,
  mergedCount,
}: ResultSummaryProps) {
  const meta = MODE_LABEL[searchType];
  const isSmart = searchType === "hybrid";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span>
          Found <strong className="text-text-primary">{count}</strong>{" "}
          {count === 1 ? "candidate" : "candidates"}
        </span>
        <span>·</span>
        <span className={cn("rounded-full px-2 py-0.5 font-medium", meta.badge)}>
          {meta.text}
        </span>
        <span>·</span>
        <span className="tabular-nums">{duration} ms</span>
      </div>

      {isSmart && (
        <div className="flex flex-wrap items-center gap-1.5">
          <PipelineBadge icon={ListChecks} label="Re-ranked" />
          <PipelineBadge
            icon={Layers}
            label={
              mergedCount && mergedCount > 0
                ? `De-duplicated · ${mergedCount} merged`
                : "De-duplicated"
            }
          />
          <PipelineBadge icon={Sparkles} label="AI summarized" />
          {typeof timings?.totalMs === "number" && (
            <span className="text-[11px] text-text-muted tabular-nums">
              pipeline {timings.totalMs} ms
            </span>
          )}
        </div>
      )}

      {degraded && (
        <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
          <AlertTriangle size={12} />
          Degraded mode — some stages used a fallback
          {warnings && warnings.length > 0 ? `: ${warnings[0]}` : ""}
        </div>
      )}
    </div>
  );
}

function PipelineBadge({
  icon: Icon,
  label,
}: {
  icon: typeof Layers;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-text-primary">
      <Icon size={11} className="text-score-hybrid" /> {label}
    </span>
  );
}

export default ResultSummary;
