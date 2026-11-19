/** LoadingDots — three-dot typing animation shown while a search is running. */
export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Searching">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-text-muted animate-dot-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default LoadingDots;
