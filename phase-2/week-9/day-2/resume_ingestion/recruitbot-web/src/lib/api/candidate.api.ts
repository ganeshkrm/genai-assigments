import apiClient from "./client";
import type { CandidateProfile } from "@/types/candidate.types";

/**
 * Candidate API (Phase 14) — fetches one full profile from the new read-only
 * backend endpoint `GET /v1/candidate/:id`.
 */
export const candidateApi = {
  async getCandidate(id: string): Promise<CandidateProfile> {
    const res = await apiClient.get<CandidateProfile>(`/v1/candidate/${id}`);
    return res.data;
  },
};
