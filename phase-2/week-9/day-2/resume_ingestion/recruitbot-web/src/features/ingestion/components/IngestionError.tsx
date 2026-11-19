import { AlertTriangle, RefreshCw, FilePlus2 } from "lucide-react";
import { IngestionStages } from "./IngestionStages";
import { mapErrorToLabel } from "../utils/errorLabel";

/**
 * IngestionError — Phase 8 recoverable error screen.
 *
 * Shown within the same ingestion card when the backend/network fails. It:
 *   - keeps the Phase 5 stepper so the failed stage (✕) stays visible;
 *   - shows the documented user-facing state (mapped from the real errorCode)
 *     plus the actual backend message + code (no false success);
 *   - offers frontend-only recovery: Retry (same file) and Choose Another File.
 *
 * The selected file is preserved on error (not cleared), so Retry can reuse it.
 * Retry is frontend-only and does not auto-fire, avoiding duplicate records.
 */
interface IngestionErrorProps {
  code: string;
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
  onChooseAnother: () => void;
}

export function IngestionError({
  code,
  message,
  isRetrying,
  onRetry,
  onChooseAnother,
}: IngestionErrorProps) {
  const label = mapErrorToLabel(code);

  return (
    <div className="ingestion-error" role="alert">
      <IngestionStages status="error" uploadProgress={0} errorCode={code} />

      <div className="error-badge">
        <AlertTriangle size={30} aria-hidden />
      </div>
      <h3 className="error-title">Upload failed</h3>
      <p className="error-state">{label}</p>
      <p className="error-detail">
        {message} <span className="error-code">({code})</span>
      </p>

      <div className="error-actions">
        <button
          type="button"
          className="upload-button error-retry"
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying}
          aria-label="Retry upload"
        >
          <RefreshCw
            size={16}
            aria-hidden
            className={isRetrying ? "upload-spin" : ""}
            style={{ verticalAlign: "-3px", marginRight: 8 }}
          />
          {isRetrying ? "Retrying…" : "Retry"}
        </button>

        <button
          type="button"
          className="upload-button-secondary"
          onClick={onChooseAnother}
          disabled={isRetrying}
          aria-label="Choose another file"
        >
          <FilePlus2
            size={16}
            aria-hidden
            style={{ verticalAlign: "-3px", marginRight: 8 }}
          />
          Choose Another File
        </button>
      </div>
    </div>
  );
}

export default IngestionError;
