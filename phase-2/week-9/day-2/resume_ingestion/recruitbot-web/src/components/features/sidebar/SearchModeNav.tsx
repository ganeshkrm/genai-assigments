import { Check, Combine, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchMode } from "@/types/search.types";

/**
 * SearchModeNav — Vector / BM25 / Hybrid mode switch.
 * Active button is indigo-tinted; the active mode shows a checkmark.
 */
interface ModeDef {
  id: SearchMode;
  name: string;
  desc: string;
  icon: typeof Sparkles;
}

// Smart Search (full RAG pipeline) is the primary, recommended mode.
// Vector / BM25 are raw-retrieval comparison modes.
const MODES: ModeDef[] = [
  {
    id: "hybrid",
    name: "Smart Search",
    desc: "Re-ranked · de-duplicated · summarized",
    icon: Combine,
  },
  { id: "vector", name: "Vector (raw)", desc: "Semantic similarity", icon: Sparkles },
  { id: "bm25", name: "Keyword (raw)", desc: "Exact keyword match", icon: Search },
];

interface SearchModeNavProps {
  activeMode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export function SearchModeNav({ activeMode, onChange }: SearchModeNavProps) {
  return (
    <div className="flex flex-col gap-2">
      {MODES.map((m) => {
        const active = activeMode === m.id;
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-pressed={active}
            aria-label={`${m.name} — ${m.desc}`}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              active
                ? "bg-indigo-500/[0.12] border-indigo-400/30"
                : "border-white/[0.07] hover:bg-white/5"
            )}
          >
            <Icon
              size={18}
              className={active ? "text-primary" : "text-text-muted"}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">
                {m.name}
              </div>
              <div className="text-xs text-text-muted">{m.desc}</div>
            </div>
            {active && <Check size={16} className="text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export default SearchModeNav;
