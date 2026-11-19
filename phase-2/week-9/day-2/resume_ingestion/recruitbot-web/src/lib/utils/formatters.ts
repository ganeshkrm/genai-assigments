/** Formatting helpers shared across the retrieval UI. */

/** Format a Date as HH:mm (24h). */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Format a numeric score to a short fixed-precision string. */
export function formatScore(score: number | undefined | null): string {
  if (typeof score !== "number" || Number.isNaN(score)) return "—";
  return score.toFixed(2);
}
