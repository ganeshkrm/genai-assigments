import { CheckCircle2, RotateCcw } from "lucide-react";
import type { IngestionTimings } from "../types/ingestion.types";

/**
 * IngestionResult — Phase 6 result screen.
 *
 * Shown within the SAME ingestion card after the backend confirms success
 * (no navigation away, no page deletion). Every line reflects the documented
 * completed ingestion flow; `resumeId` (and the optional total time) are the
 * only values taken directly from the real success response — no fabricated
 * per-item backend fields.
 *
 * "Upload Another Resume" resets ingestion state only (via the store's reset).
 */
interface IngestionResultProps {
  resumeId: string;
  timings?: IngestionTimings;
  onReset: () => void;
}

const COMPLETED_ITEMS = [
  "Resume uploaded successfully",
  "Embedding generated successfully",
  "MongoDB ingestion completed",
  "Vector search ready",
];

export function IngestionResult({
  resumeId,
  timings,
  onReset,
}: IngestionResultProps) {
  return (
    <div className="ingestion-result" role="status" aria-live="polite">
      <div className="result-badge">
        <CheckCircle2 size={34} aria-hidden />
      </div>
      <h3 className="result-title">Resume Ingestion Completed</h3>

      <ul className="result-items">
        {COMPLETED_ITEMS.map((item) => (
          <li key={item} className="result-item">
            <CheckCircle2 size={16} aria-hidden /> {item}
          </li>
        ))}
      </ul>

      <p className="result-meta">
        resumeId: <code>{resumeId}</code>
        {typeof timings?.totalMs === "number" && (
          <> · {timings.totalMs} ms</>
        )}
      </p>

      <button
        type="button"
        className="upload-button result-reset"
        onClick={onReset}
        aria-label="Upload another resume"
      >
        <RotateCcw
          size={16}
          aria-hidden
          style={{ verticalAlign: "-3px", marginRight: 8 }}
        />
        Upload Another Resume
      </button>
    </div>
  );
}

export default IngestionResult;
