import { SearchX } from "lucide-react";

/** EmptyState — shown when a search returns no candidates. */
export function EmptyState({
  title = "No candidates found",
  subtitle = "Try a different query or switch search mode.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <SearchX size={28} className="text-text-muted" aria-hidden />
      <div className="text-sm font-medium text-text-primary">{title}</div>
      <div className="text-xs text-text-muted">{subtitle}</div>
    </div>
  );
}

export default EmptyState;
