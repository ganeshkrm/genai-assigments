import { SectionLabel } from "./SectionLabel";
import type { CandidateProfile } from "@/types/candidate.types";

/** ProjectsSection — hidden if the array is empty (common for this backend). */
export function ProjectsSection({ candidate }: { candidate: CandidateProfile }) {
  const projects = candidate.projects ?? [];
  if (projects.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Projects</SectionLabel>
      <ul className="flex flex-col gap-2">
        {projects.map((p, i) => (
          <li key={i} className="text-sm">
            <div className="font-medium text-text-primary">{p.title}</div>
            <p className="text-xs text-text-muted">{p.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProjectsSection;
