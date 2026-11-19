import { SectionLabel } from "./SectionLabel";
import type { CandidateProfile } from "@/types/candidate.types";

/** CertificationsSection — hidden if the array is empty. */
export function CertificationsSection({
  candidate,
}: {
  candidate: CandidateProfile;
}) {
  const certs = candidate.certifications ?? [];
  if (certs.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Certifications</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {certs.map((c) => (
          <span
            key={c}
            className="rounded bg-white/5 px-2 py-1 text-xs text-text-primary"
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

export default CertificationsSection;
