import { motion } from "framer-motion";
import { Briefcase, Building2, Sparkles } from "lucide-react";
import { RankBadge } from "./RankBadge";
import { ScorePill } from "./ScorePill";
import type { RetrievalResult, SearchMode } from "@/types/search.types";

const SOURCE_LABEL: Record<string, string> = {
  bm25: "Keyword",
  vector: "Vector",
};

/**
 * ResultCard — a single ranked candidate. Clicking opens the candidate modal
 * (wired via onSelect). Renders whatever fields the mode returned; absent
 * fields are hidden. All text is React-escaped by default (no raw HTML).
 */
interface ResultCardProps {
  result: RetrievalResult;
  rank: number;
  searchType: SearchMode;
  onSelect: (resumeId: string) => void;
}

export function ResultCard({
  result,
  rank,
  searchType,
  onSelect,
}: ResultCardProps) {
  const skills =
    result.matchedSkills && result.matchedSkills.length > 0
      ? result.matchedSkills
      : (result.skills ?? []);
  const hasAiSummary = !!result.summary;
  const snippet = result.summary ?? result.snippet ?? result.reason ?? "";
  const sources = result.sources ?? [];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: rank * 0.06 }}
      onClick={() => onSelect(result.resumeId)}
      aria-label={`Open profile for ${result.name}`}
      className="w-full text-left rounded-xl border border-white/[0.07] bg-bg-card p-4 transition-colors hover:border-white/[0.14] hover:shadow-lg"
    >
      <div className="flex items-center gap-2">
        <RankBadge rank={rank} />
        <span className="flex-1 min-w-0 truncate text-base font-semibold text-text-primary">
          {result.name}
        </span>
        <ScorePill score={result.score} searchType={searchType} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        {result.role && (
          <span className="inline-flex items-center gap-1">
            <Briefcase size={12} /> {result.role}
          </span>
        )}
        {result.company && (
          <span className="inline-flex items-center gap-1">
            <Building2 size={12} /> {result.company}
          </span>
        )}
        {typeof result.totalExperience === "number" && (
          <span className="rounded bg-white/5 px-1.5 py-0.5">
            {result.totalExperience} yrs
          </span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.slice(0, 8).map((s) => (
            <span
              key={s}
              className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
          <span>Matched via:</span>
          {sources.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5"
            >
              {SOURCE_LABEL[s] ?? s}
            </span>
          ))}
          {sources.length > 1 && (
            <span className="text-score-hybrid">· merged</span>
          )}
        </div>
      )}

      {snippet &&
        (hasAiSummary ? (
          <div className="mt-2 rounded-lg border border-score-hybrid/20 bg-score-hybrid/[0.07] p-2.5">
            <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-score-hybrid">
              <Sparkles size={11} /> AI fit summary
            </div>
            <p className="text-xs text-text-primary/90 line-clamp-4">
              {snippet.slice(0, 320)}
              {snippet.length > 320 ? "…" : ""}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-text-muted line-clamp-3">
            {snippet.slice(0, 220)}
            {snippet.length > 220 ? "…" : ""}
          </p>
        ))}
    </motion.button>
  );
}

export default ResultCard;
