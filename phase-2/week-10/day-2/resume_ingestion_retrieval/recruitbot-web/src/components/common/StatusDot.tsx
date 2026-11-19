/** StatusDot — 6px pulsing green "online" indicator. */
export function StatusDot() {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-score-hybrid animate-status-pulse"
      aria-hidden
    />
  );
}

export default StatusDot;
