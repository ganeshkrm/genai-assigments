import { Mail, MapPin, Phone } from "lucide-react";
import type { CandidateProfile } from "@/types/candidate.types";

/** ContactSection — email / phone / location. Rows render only when present. */
export function ContactSection({ candidate }: { candidate: CandidateProfile }) {
  const rows = [
    candidate.email && { icon: Mail, value: candidate.email },
    candidate.phoneNumber && { icon: Phone, value: candidate.phoneNumber },
    candidate.location && { icon: MapPin, value: candidate.location },
  ].filter(Boolean) as { icon: typeof Mail; value: string }[];

  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <div key={i} className="flex items-center gap-2 text-sm text-text-primary">
            <Icon size={14} className="text-text-muted" /> {r.value}
          </div>
        );
      })}
    </section>
  );
}

export default ContactSection;
