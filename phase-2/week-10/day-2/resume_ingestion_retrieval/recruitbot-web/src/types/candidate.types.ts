/**
 * Candidate profile types (for the Phase 14 modal).
 *
 * NOTE: the MD assumes a `GET /candidate/:id` endpoint that does NOT exist in
 * this backend. How the modal is sourced (add a read-only backend endpoint vs.
 * reuse `/v1/search` data) is decided at Phase 13/14. These types describe the
 * intended profile shape; they will be reconciled with the real source then.
 */
export interface Experience {
  company: string;
  title: string;
  duration?: string;
  description?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
}

export interface CandidateProfile {
  _id: string;
  name: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  title?: string | null;
  company?: string | null;
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
  projects?: { title: string; description: string }[];
  certifications?: string[];
  text?: string | null;
  processedAt?: string | null;
  // Extra fields the backend's /v1/candidate/:id returns:
  totalExperience?: number | null;
  experienceSummary?: string | null;
  jobTitles?: string[];
}
