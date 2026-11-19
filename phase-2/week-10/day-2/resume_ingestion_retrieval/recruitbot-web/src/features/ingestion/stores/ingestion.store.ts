import { create } from "zustand";
import type {
  InjectSuccessResponse,
  UploadStatus,
} from "../types/ingestion.types";
import { validateResumeFile } from "../utils/validateFile";

/**
 * Ingestion store (Phase 4).
 *
 * Owns ONLY ingestion-specific UI state. It must never read or reset
 * retrieval/search state (those get their own stores in the retrieval phases).
 *
 * The store coordinates frontend state only — the actual HTTP request stays in
 * `services/ingestion.api.ts`. Business logic is not moved here.
 *
 * `uploadProgress` is part of the shape now (per the Phase 4 recommended state)
 * and is driven by the detailed progress UI in Phase 5.
 */
export interface IngestionError {
  message: string;
  code: string;
}

interface IngestionState {
  selectedFile: File | null;
  status: UploadStatus;
  uploadProgress: number; // 0..100 (used from Phase 5)
  successResult: InjectSuccessResponse | null;
  error: IngestionError | null;
  /** Frontend validation message (Phase 7) — distinct from backend `error`. */
  validationError: string | null;

  /** True while an upload request is in flight (prevents double-submit). */
  isUploading: boolean;

  /**
   * Select (or clear) a file. Runs frontend validation (Phase 7): an invalid
   * file is rejected (not stored) and surfaces a validation message, so the
   * upload stays blocked. Clears stale status for a new valid attempt.
   */
  selectFile: (file: File | null) => void;
  /** Set a frontend validation message (e.g. empty-upload attempt). */
  setValidationError: (message: string | null) => void;
  /** Mark the start of an upload. */
  startUpload: () => void;
  /** Update upload progress percentage (Phase 5). */
  setUploadProgress: (pct: number) => void;
  /** Store a confirmed backend success. */
  uploadSucceeded: (result: InjectSuccessResponse) => void;
  /** Store a backend/network error. */
  uploadFailed: (error: IngestionError) => void;
  /** Reset to a clean upload state (ingestion state only). */
  reset: () => void;
}

export const useIngestionStore = create<IngestionState>((set) => ({
  selectedFile: null,
  status: "idle",
  uploadProgress: 0,
  successResult: null,
  error: null,
  validationError: null,
  isUploading: false,

  selectFile: (file) => {
    if (!file) {
      set({
        selectedFile: null,
        status: "idle",
        uploadProgress: 0,
        successResult: null,
        error: null,
        validationError: null,
        isUploading: false,
      });
      return;
    }

    const result = validateResumeFile(file);
    if (!result.valid) {
      // Reject invalid file: do not store it, surface the message, keep upload
      // blocked. No API call will be possible.
      set({
        selectedFile: null,
        status: "idle",
        uploadProgress: 0,
        successResult: null,
        error: null,
        validationError: result.error ?? "Invalid file",
        isUploading: false,
      });
      return;
    }

    set({
      selectedFile: file,
      status: "ready",
      uploadProgress: 0,
      successResult: null,
      error: null,
      validationError: null,
      isUploading: false,
    });
  },

  setValidationError: (message) => set({ validationError: message }),

  startUpload: () =>
    set({
      status: "uploading",
      isUploading: true,
      uploadProgress: 0,
      successResult: null,
      error: null,
      validationError: null,
    }),

  setUploadProgress: (pct) =>
    set({ uploadProgress: Math.max(0, Math.min(100, pct)) }),

  uploadSucceeded: (result) =>
    set({
      status: "success",
      isUploading: false,
      uploadProgress: 100,
      successResult: result,
      error: null,
    }),

  uploadFailed: (error) =>
    set({
      status: "error",
      isUploading: false,
      error,
    }),

  reset: () =>
    set({
      selectedFile: null,
      status: "idle",
      uploadProgress: 0,
      successResult: null,
      error: null,
      validationError: null,
      isUploading: false,
    }),
}));
