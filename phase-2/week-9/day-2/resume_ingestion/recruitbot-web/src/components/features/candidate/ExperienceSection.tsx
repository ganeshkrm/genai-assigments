import { SectionLabel } from "./SectionLabel";
import type { CandidateProfile } from "@/types/candidate.types";

/**
 * ExperienceSection — renders the structured experience timeline when present,
 * otherwise falls back to the total-experience + job-titles + summary that the
 * backend actually stores. Hidden when there's nothing to show.
 */
export function ExperienceSection({ candidate }: { candidate: CandidateProfile }) {
  const experience = candidate.experience ?? [];
  const jobTitles = candidate.jobTitles ?? [];
  const hasFallback =
    typeof candidate.totalExperience === "number" ||
    jobTitles.length > 0 ||
    !!candidate.experienceSummary;

  if (experience.length === 0 && !hasFallback) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Experience</SectionLabel>

      {experience.length > 0 ? (
        <ol className="flex flex-col gap-3 border-l border-white/10 pl-3">
          {experience.map((e, i) => (
            <li key={i} className="text-sm">
              <div className="font-medium text-text-primary">
                {e.title}
                {e.company ? ` · ${e.company}` : ""}
              </div>
              {e.duration && (
                <div className="text-xs text-text-muted">{e.duration}</div>
              )}
              {e.description && (
                <p className="mt-1 text-xs text-text-muted">{e.description}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col gap-2 text-sm text-text-primary">
          {typeof candidate.totalExperience === "number" && (
            <div className="text-text-muted">
              Total experience:{" "}
              <span className="text-text-primary">
                {candidate.totalExperience} years
              </span>
            </div>
          )}
          {jobTitles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {jobTitles.map((t) => (
                <span
                  key={t}
                  className="rounded bg-white/5 px-2 py-0.5 text-xs text-text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {candidate.experienceSummary && (
            <p className="text-xs text-text-muted">
              {candidate.experienceSummary}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default ExperienceSection;
