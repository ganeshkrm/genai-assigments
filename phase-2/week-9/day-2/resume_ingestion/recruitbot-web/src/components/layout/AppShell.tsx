import type { ReactNode } from "react";

/**
 * AppShell — outer flex container for the retrieval app (sidebar + main).
 * Full viewport height; children are the Sidebar and the main chat column.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-base text-text-primary">
      {children}
    </div>
  );
}

export default AppShell;
