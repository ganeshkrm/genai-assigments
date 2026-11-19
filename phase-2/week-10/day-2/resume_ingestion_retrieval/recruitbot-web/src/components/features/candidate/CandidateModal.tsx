import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCandidateStore } from "@/lib/stores/candidate.store";
import { ModalHeader } from "./ModalHeader";
import { ContactSection } from "./ContactSection";
import { SkillsSection } from "./SkillsSection";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { ProjectsSection } from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";

/**
 * CandidateModal — full profile modal for a selected result.
 *
 * Uses the Radix Dialog primitive, which provides the focus trap, Escape-to-
 * close, overlay-click-close and scroll locking. Shows a loading skeleton while
 * `GET /v1/candidate/:id` is in flight. Empty sections are hidden gracefully.
 * All text is React-escaped (no raw HTML injection).
 */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
      <div className="h-4 w-56 rounded bg-white/5 animate-pulse" />
      <div className="mt-2 h-20 w-full rounded bg-white/5 animate-pulse" />
      <div className="h-16 w-full rounded bg-white/5 animate-pulse" />
    </div>
  );
}

export function CandidateModal() {
  const isOpen = useCandidateStore((s) => s.isOpen);
  const candidate = useCandidateStore((s) => s.candidate);
  const loading = useCandidateStore((s) => s.loading);
  const close = useCandidateStore((s) => s.close);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent aria-describedby={undefined}>
        {loading || !candidate ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            <ModalHeader candidate={candidate} />
            <ContactSection candidate={candidate} />
            <SkillsSection candidate={candidate} />
            <ExperienceSection candidate={candidate} />
            <EducationSection candidate={candidate} />
            <ProjectsSection candidate={candidate} />
            <CertificationsSection candidate={candidate} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CandidateModal;
