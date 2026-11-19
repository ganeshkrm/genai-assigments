/**
 * Ingestion types (Phase 3).
 *
 * Mirrors the REAL backend contract for `POST /v1/resume/inject`:
 *   success: { success, message, resumeId, data, timings }
 *   error:   { success: false, requestId, errorCode, message }
 * (defined in the backend's ingestionController + errorHandler).
 */

/** UI-level status for a single upload attempt. */
export type UploadStatus =
  | "idle"
  | "ready"
  | "uploading"
  | "success"
  | "error";

/**
 * Per-stage timings returned by the inject pipeline (real backend values).
 * Keys mirror the backend's IngestionTimings.
 */
export interface IngestionTimings {
  extractMs?: number;
  cleanMs?: number;
  parseMs?: number;
  embeddingMs?: number;
  mongoInsertMs?: number;
  totalMs?: number;
}

/** Successful ingestion response from `POST /v1/resume/inject`. */
export interface InjectSuccessResponse {
  success: true;
  message: string;
  resumeId: string;
  data?: Record<string, unknown>;
  timings?: IngestionTimings;
}

/** Standard backend error response shape. */
export interface BackendErrorResponse {
  success: false;
  requestId?: string;
  errorCode: string;
  message: string;
}
