/**
 * Maps the REAL backend error codes to the documented user-facing error states
 * (Phase 8). The backend error logic is NOT changed — this is display-only.
 *
 * A network error is deliberately kept distinct and never shown as a MongoDB
 * or parsing failure.
 */
export function mapErrorToLabel(code: string | undefined): string {
  switch (code) {
    case "RESUME_EXTRACTION_FAILED":
      return "PDF extraction failed";
    case "RESUME_PARSE_FAILED":
      return "Resume parsing failed";
    case "EMBEDDING_FAILED":
      return "Embedding generation failed";
    case "INGESTION_FAILED":
      return "MongoDB ingestion failed";
    case "NETWORK_ERROR":
      return "Network error";
    case "INVALID_FILE_TYPE":
      return "Only PDF allowed";
    case "FILE_TOO_LARGE":
      return "Maximum 5MB allowed";
    case "FILE_REQUIRED":
      return "Please select a file";
    case "PAYLOAD_TOO_LARGE":
      return "File too large";
    case "INTERNAL_ERROR":
      return "Server error";
    default:
      return "Upload failed";
  }
}
