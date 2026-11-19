import { create } from "zustand";

/**
 * UI store (Phase 10 skeleton) — cross-cutting UI state (mobile drawer, etc.).
 * Modal state for the candidate profile lives in its own hook (Phase 14);
 * toasts are handled by react-hot-toast.
 */
interface UIState {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
}));
