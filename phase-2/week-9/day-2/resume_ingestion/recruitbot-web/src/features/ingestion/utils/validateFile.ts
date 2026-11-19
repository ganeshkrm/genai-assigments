/**
 * Frontend upload validation (Phase 7).
 *
 * Mirrors the backend's accept rules (PDF only, max 5 MB) so invalid input is
 * caught BEFORE any network request. The backend remains the source of truth
 * and still rejects bad input independently — this only avoids unnecessary
 * API calls and gives immediate feedback.
 */

/** Max upload size in MB — matches backend MAX_UPLOAD_SIZE_MB (default 5). */
export const MAX_UPLOAD_SIZE_MB = 5;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate a selected file's type and size. */
export function validateResumeFile(file: File): FileValidationResult {
  const isPdfMime = file.type === "application/pdf";
  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExt) {
    return { valid: false, error: "Only PDF allowed" };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: "Maximum 5MB allowed" };
  }

  return { valid: true };
}

/** Message shown when the user tries to upload without choosing a file. */
export const EMPTY_FILE_MESSAGE = "Please select a file";
