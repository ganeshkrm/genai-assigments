import { SectionLabel } from "./SectionLabel";
import type { CandidateProfile } from "@/types/candidate.types";

/** SkillsSection — flex-wrap cloud of skill chips. Hidden when empty. */
export function SkillsSection({ candidate }: { candidate: CandidateProfile }) {
  const skills = candidate.skills ?? [];
  if (skills.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Skills</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span
            key={s}
            className="rounded bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300"
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

export default SkillsSection;
