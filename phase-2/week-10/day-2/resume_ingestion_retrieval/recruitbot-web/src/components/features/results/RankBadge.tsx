import { cn } from "@/lib/utils";

/** RankBadge — #1/#2/#3 get the gradient fill; lower ranks are muted. */
export function RankBadge({ rank }: { rank: number }) {
  const isTop = rank <= 3;
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
        isTop
          ? "bg-gradient-to-br from-primary to-accent text-white"
          : "bg-white/10 text-text-muted"
      )}
    >
      #{rank}
    </span>
  );
}

export default RankBadge;
