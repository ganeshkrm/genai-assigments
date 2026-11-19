import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/lib/stores/search.store";
import { useUIStore } from "@/lib/stores/ui.store";
import { BrandAvatar } from "@/components/common/BrandAvatar";
import { SearchModeNav } from "@/components/features/sidebar/SearchModeNav";
import { ResultsLimitSelect } from "@/components/features/sidebar/ResultsLimitSelect";
import { ClearChatButton } from "@/components/features/sidebar/ClearChatButton";

function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-xs font-medium uppercase tracking-widest text-text-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Shared sidebar content (used by both the desktop rail and the mobile drawer). */
function SidebarContent() {
  const searchType = useSearchStore((s) => s.searchType);
  const setSearchType = useSearchStore((s) => s.setSearchType);

  return (
    <div className="flex h-full flex-col gap-4 p-5 overflow-y-auto">
      <BrandAvatar />

      <SectionLabel>Search Mode</SectionLabel>
      <SearchModeNav activeMode={searchType} onChange={setSearchType} />

      <SectionLabel className="mt-auto">Results limit</SectionLabel>
      <ResultsLimitSelect />

      <ClearChatButton />

      <Link
        to="/ingestion"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
      >
        <Upload size={15} /> Ingest a resume
      </Link>

      <footer className="pt-1 text-xs text-text-muted">
        Talent Acquisition · RecruitBot v2.0
      </footer>
    </div>
  );
}

/**
 * Sidebar — static 260px rail on desktop; a slide-in overlay drawer on mobile
 * (toggled from the chat topbar via the UI store).
 */
export function Sidebar() {
  const isOpen = useUIStore((s) => s.isMobileSidebarOpen);
  const setOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:block w-[260px] shrink-0 bg-bg-surface border-r border-white/[0.07]">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-[270px] bg-bg-surface border-r border-white/[0.07] shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 rounded-md p-1 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;
