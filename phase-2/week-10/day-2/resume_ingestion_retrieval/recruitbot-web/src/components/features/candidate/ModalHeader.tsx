import { DialogTitle } from "@/components/ui/dialog";
import type { CandidateProfile } from "@/types/candidate.types";

/** ModalHeader — candidate name + title/company meta. (Close button is in DialogContent.) */
export function ModalHeader({ candidate }: { candidate: CandidateProfile }) {
  const meta = [candidate.title, candidate.company].filter(Boolean).join(" · ");
  return (
    <div className="pr-8">
      <DialogTitle className="text-xl">
        {candidate.name || "Candidate"}
      </DialogTitle>
      {meta && <p className="mt-0.5 text-sm text-text-muted">{meta}</p>}
    </div>
  );
}

export default ModalHeader;
