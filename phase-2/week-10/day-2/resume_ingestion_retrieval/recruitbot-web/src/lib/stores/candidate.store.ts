import { create } from "zustand";
import toast from "react-hot-toast";
import { candidateApi } from "@/lib/api/candidate.api";
import type { CandidateProfile } from "@/types/candidate.types";

/**
 * Candidate modal store (Phase 14).
 *
 * A store (not a local hook) because result cards live inside persisted chat
 * messages — a global open() avoids stale closures / prop drilling through
 * stored ReactNodes.
 */
interface CandidateModalState {
  isOpen: boolean;
  candidate: CandidateProfile | null;
  loading: boolean;
  open: (id: string) => Promise<void>;
  close: () => void;
}

export const useCandidateStore = create<CandidateModalState>((set) => ({
  isOpen: false,
  candidate: null,
  loading: false,
  open: async (id: string) => {
    set({ isOpen: true, loading: true, candidate: null });
    try {
      const data = await candidateApi.getCandidate(id);
      set({ candidate: data, loading: false });
    } catch {
      toast.error("Failed to load candidate profile.");
      set({ isOpen: false, loading: false, candidate: null });
    }
  },
  close: () => set({ isOpen: false, candidate: null, loading: false }),
}));
