import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useSearchStore } from "@/lib/stores/search.store";

/** ResultsLimitSelect — "Show top [N] results" selector wired to the store. */
const OPTIONS = [3, 5, 10, 20];

export function ResultsLimitSelect() {
  const topK = useSearchStore((s) => s.topK);
  const setTopK = useSearchStore((s) => s.setTopK);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted whitespace-nowrap">Show top</span>
      <Select value={String(topK)} onValueChange={(v) => setTopK(Number(v))}>
        <SelectTrigger className="w-[76px]" aria-label="Results limit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-text-muted">results</span>
    </div>
  );
}

export default ResultsLimitSelect;
