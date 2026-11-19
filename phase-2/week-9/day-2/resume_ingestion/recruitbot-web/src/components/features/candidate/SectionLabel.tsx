import type { ReactNode } from "react";

/** Small uppercase section label used across the candidate modal. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-widest text-text-muted">
      {children}
    </h3>
  );
}

export default SectionLabel;
