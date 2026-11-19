import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { IngestionStages } from "./IngestionStages";
import type {
  IngestionTimings,
  UploadStatus,
} from "../types/ingestion.types";

/**
 * UploadProgress — Phase 5 (extended, not replaced).
 *
 * Renders the staged pipeline view (IngestionStages) plus a single honest
 * caption. The success state only appears after the backend confirms; the
 * per-server stages are shown as an indeterminate "processing" state because
 * the inject API returns one final response rather than streaming stage events.
 */
interface UploadProgressProps {
  status: UploadStatus;
  uploadProgress: number;
  timings?: IngestionTimings;
  errorCode?: string;
  message?: string;
}

export function UploadProgress({
  status,
  uploadProgress,
  timings,
  errorCode,
  message,
}: UploadProgressProps) {
  let caption: React.ReactNode;
  let captionClass = "upload-progress";

  switch (status) {
    case "idle":
      caption = "No file selected yet — choose a PDF to begin";
      break;
    case "ready":
      captionClass += " is-ready";
      caption = "Ready to upload";
      break;
    case "uploading":
      captionClass += " is-uploading";
      caption =
        uploadProgress < 100 ? (
          <>
            <Loader2 size={14} className="upload-spin" aria-hidden /> Uploading
            file… {uploadProgress}%
          </>
        ) : (
          <>
            <Loader2 size={14} className="upload-spin" aria-hidden /> Processing
            on server… (stages not individually streamed)
          </>
        );
      break;
    case "success":
      captionClass += " is-success";
      caption = (
        <>
          <CheckCircle2 size={14} aria-hidden /> {message || "Ingestion completed"}
        </>
      );
      break;
    case "error":
      captionClass += " is-error";
      caption = (
        <>
          <XCircle size={14} aria-hidden /> {message || "Upload failed"}
        </>
      );
      break;
  }

  return (
    <div className="upload-progress-wrap">
      <IngestionStages
        status={status}
        uploadProgress={uploadProgress}
        timings={timings}
        errorCode={errorCode}
      />
      <div className={captionClass} aria-live="polite" role="status">
        {caption}
      </div>
    </div>
  );
}

export default UploadProgress;
