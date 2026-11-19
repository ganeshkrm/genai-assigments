import { Bot, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/lib/stores/search.store";
import { useUIStore } from "@/lib/stores/ui.store";
import type { SearchMode } from "@/types/search.types";

/** Per-mode display metadata (sub-label + badge colour + badge text). */
const MODE_META: Record<
  SearchMode,
  { sublabel: string; badge: string; badgeClass: string }
> = {
  vector: {
    sublabel: "Vector (raw) · Semantic similarity",
    badge: "Vector",
    badgeClass: "bg-score-vector/20 text-score-vector",
  },
  bm25: {
    sublabel: "Keyword (raw) · Exact keyword match",
    badge: "Keyword",
    badgeClass: "bg-score-bm25/20 text-score-bm25",
  },
  hybrid: {
    sublabel: "Smart Search · Re-ranked & summarized",
    badge: "Smart",
    badgeClass: "bg-score-hybrid/20 text-score-hybrid",
  },
};

/** ChatTopbar — name + reactive mode sub-label (left), mode badge (right). */
export function ChatTopbar() {
  const searchType = useSearchStore((s) => s.searchType);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const meta = MODE_META[searchType];

  return (
    <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
          className="md:hidden rounded-md p-1 text-text-muted hover:text-text-primary"
        >
          <Menu size={20} />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
          <Bot size={16} />
        </span>
        <div>
          <div className="text-sm font-semibold text-text-primary">
            RecruitBot
          </div>
          <div className="text-xs text-text-muted">{meta.sublabel}</div>
        </div>
      </div>

      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          meta.badgeClass
        )}
      >
        {meta.badge}
      </span>
    </header>
  );
}

export default ChatTopbar;
