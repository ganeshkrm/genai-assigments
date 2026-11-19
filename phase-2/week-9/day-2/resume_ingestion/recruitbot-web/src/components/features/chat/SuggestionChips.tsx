/**
 * SuggestionChips — pre-canned query chips shown only when the thread is empty.
 * Clicking a chip submits that query (auto-submit).
 */
interface SuggestionChipsProps {
  onSelect: (query: string) => void;
}

const CHIPS: Array<{ emoji: string; label: string; query: string }> = [
  { emoji: "🔍", label: "Selenium QA 3 yrs", query: "Selenium automation engineer 3 years" },
  { emoji: "🐍", label: "Python ML dev", query: "Python developer with machine learning" },
  { emoji: "☁️", label: "Java AWS backend", query: "Java backend developer AWS cloud" },
  { emoji: "⚡", label: "Lead QA Cypress", query: "Lead QA engineer with Cypress and CI/CD" },
];

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-5 pb-3">
      {CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelect(chip.query)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-bg-card px-3 py-1.5 text-xs text-text-primary transition-colors hover:border-primary/40 hover:bg-white/5"
        >
          <span aria-hidden>{chip.emoji}</span> {chip.label}
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
