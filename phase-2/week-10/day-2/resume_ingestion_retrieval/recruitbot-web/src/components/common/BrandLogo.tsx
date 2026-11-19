/**
 * BrandLogo — PLACEHOLDER brand mark (an original, generic purple search glyph).
 *
 * Replace the <svg> contents below with your organization's official logo SVG
 * when you have the approved asset (keep the `size` prop and the outer element
 * so every usage updates at once).
 */
export function BrandLogo({
  size = 36,
  title = "RecruitBot",
}: {
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${title} logo`}
      className="shrink-0"
    >
      <rect width="64" height="64" rx="14" fill="#5A287D" />
      <circle
        cx="27"
        cy="27"
        r="11"
        fill="none"
        stroke="#F3F0F7"
        strokeWidth="4"
      />
      <line
        x1="35"
        y1="35"
        x2="48"
        y2="48"
        stroke="#F3F0F7"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BrandLogo;
