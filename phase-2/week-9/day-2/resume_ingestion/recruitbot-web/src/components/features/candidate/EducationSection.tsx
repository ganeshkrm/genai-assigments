import { SectionLabel } from "./SectionLabel";
import type { CandidateProfile } from "@/types/candidate.types";

/** EducationSection — degree + institution + year. Hidden when empty. */
export function EducationSection({ candidate }: { candidate: CandidateProfile }) {
  const education = (candidate.education ?? []).filter(
    (e) => e.degree || e.institution
  );
  if (education.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Education</SectionLabel>
      <ul className="flex flex-col gap-1.5">
        {education.map((e, i) => (
          <li key={i} className="text-sm text-text-primary">
            {e.degree}
            {e.institution ? ` — ${e.institution}` : ""}
            {e.year ? (
              <span className="text-text-muted"> ({e.year})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default EducationSection;
