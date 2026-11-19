import { Combine, Search, Sparkles } from "lucide-react";
import { BotBubble } from "./BotBubble";

/**
 * WelcomeMessage — intro bot bubble shown on first load / after clear.
 * Highlights Smart Search (the full RAG pipeline) as the default mode.
 */
export function WelcomeMessage() {
  return (
    <BotBubble>
      <p className="font-medium">Welcome to RecruitBot — Talent Acquisition 👋</p>
      <p className="mt-1 text-text-muted">
        Describe the candidate you're looking for and I'll search the resume
        database. <strong className="text-text-primary">Smart Search</strong>{" "}
        (default) retrieves, de-duplicates, re-ranks and summarizes the best
        matches. You can switch modes in the sidebar:
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 text-text-muted">
        <li className="flex items-center gap-2">
          <Combine size={14} className="text-score-hybrid" /> Smart Search —
          re-ranked · de-duplicated · AI-summarized
        </li>
        <li className="flex items-center gap-2">
          <Sparkles size={14} className="text-score-vector" /> Vector (raw) —
          semantic similarity
        </li>
        <li className="flex items-center gap-2">
          <Search size={14} className="text-score-bm25" /> Keyword (raw) — exact
          keyword match
        </li>
      </ul>
    </BotBubble>
  );
}

export default WelcomeMessage;
