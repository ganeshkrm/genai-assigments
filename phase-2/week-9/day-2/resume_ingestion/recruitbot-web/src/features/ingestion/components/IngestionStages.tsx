import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type {
  IngestionTimings,
  UploadStatus,
} from "../types/ingestion.types";

/**
 * IngestionStages — Phase 5 staged pipeline view.
 *
 * HONEST progress model (no fabricated backend events): the inject endpoint
 * returns a single final response, not per-stage events. So:
 *   - "Resume Upload" uses the REAL axios byte-upload percentage.
 *   - Once bytes are fully uploaded, the server stages are shown as a single
 *     indeterminate "processing" state (the API does not stream them).
 *   - On success, every stage is marked complete and annotated with the REAL
 *     per-stage durations from the response `timings`.
 *   - On error, the backend `errorCode` identifies exactly which stage failed;
 *     earlier stages are complete, that stage failed, later stages pending.
 */
type StageState = "pending" | "active" | "complete" | "failed";

interface StageDef {
  id: string;
  label: string;
  timingKey?: keyof IngestionTimings;
}

const STAGES: StageDef[] = [
  { id: "upload", label: "Resume Upload" },
  { id: "pdf", label: "PDF Processing", timingKey: "extractMs" },
  { id: "parse", label: "Resume Parsing", timingKey: "parseMs" },
  { id: "embed", label: "Embedding Generation", timingKey: "embeddingMs" },
  { id: "store", label: "MongoDB Ingestion", timingKey: "mongoInsertMs" },
  { id: "done", label: "Completed", timingKey: "totalMs" },
];

/** Map a backend error code to the index of the stage that failed. */
function failedStageIndex(code: string | undefined): number {
  switch (code) {
    case "RESUME_EXTRACTION_FAILED":
      return 1; // PDF Processing
    case "RESUME_PARSE_FAILED":
      return 2; // Resume Parsing
    case "EMBEDDING_FAILED":
      return 3; // Embedding Generation
    case "INGESTION_FAILED":
    case "INTERNAL_ERROR":
      return 4; // MongoDB Ingestion
    // FILE_REQUIRED / INVALID_FILE_TYPE / FILE_TOO_LARGE / NETWORK_ERROR / etc.
    default:
      return 0; // Resume Upload
  }
}

interface IngestionStagesProps {
  status: UploadStatus;
  uploadProgress: number;
  timings?: IngestionTimings;
  errorCode?: string;
}

function computeStates(
  status: UploadStatus,
  uploadProgress: number,
  errorCode?: string
): StageState[] {
  const n = STAGES.length;

  if (status === "idle" || status === "ready") {
    return Array(n).fill("pending");
  }

  if (status === "success") {
    return Array(n).fill("complete");
  }

  if (status === "error") {
    const failIdx = failedStageIndex(errorCode);
    return STAGES.map((_, i) =>
      i < failIdx ? "complete" : i === failIdx ? "failed" : "pending"
    );
  }

  // status === "uploading"
  if (uploadProgress < 100) {
    // Still transferring bytes: only the upload stage is active.
    return STAGES.map((_, i) => (i === 0 ? "active" : "pending"));
  }
  // Bytes uploaded; server is processing (stages not individually streamed).
  // Upload done; pdf/parse/embed/store shown as active; "Completed" pending.
  return STAGES.map((_, i) =>
    i === 0 ? "complete" : i === n - 1 ? "pending" : "active"
  );
}

function StageIcon({ state }: { state: StageState }) {
  switch (state) {
    case "complete":
      return <CheckCircle2 size={16} className="stage-icon stage-complete" aria-hidden />;
    case "active":
      return <Loader2 size={16} className="stage-icon stage-active upload-spin" aria-hidden />;
    case "failed":
      return <XCircle size={16} className="stage-icon stage-failed" aria-hidden />;
    default:
      return <Circle size={16} className="stage-icon stage-pending" aria-hidden />;
  }
}

export function IngestionStages({
  status,
  uploadProgress,
  timings,
  errorCode,
}: IngestionStagesProps) {
  if (status === "idle") return null;

  const states = computeStates(status, uploadProgress, errorCode);

  return (
    <ul className="stage-list" aria-label="Ingestion pipeline progress">
      {STAGES.map((stage, i) => {
        const state = states[i];
        const ms =
          status === "success" && stage.timingKey
            ? timings?.[stage.timingKey]
            : undefined;

        // Real byte-upload percentage annotation on the upload stage.
        const uploadPct =
          stage.id === "upload" && status === "uploading" && uploadProgress < 100
            ? `${uploadProgress}%`
            : undefined;

        return (
          <li key={stage.id} className={`stage-row stage-${state}`}>
            <StageIcon state={state} />
            <span className="stage-label">{stage.label}</span>
            {uploadPct && <span className="stage-meta">{uploadPct}</span>}
            {ms !== undefined && (
              <span className="stage-meta">{ms} ms</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default IngestionStages;
