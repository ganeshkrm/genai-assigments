import { UploadDropzone } from "./UploadDropzone";
import { UploadButton } from "./UploadButton";
import { UploadProgress } from "./UploadProgress";
import { IngestionResult } from "./IngestionResult";
import { IngestionError } from "./IngestionError";
import { ingestionApi, IngestionApiError } from "../services/ingestion.api";
import { useIngestionStore } from "../stores/ingestion.store";
import { EMPTY_FILE_MESSAGE } from "../utils/validateFile";

/**
 * ResumeUploadCard — Phase 6 (result screen).
 *
 * Same upload/API flow and store wiring. On a backend-confirmed success, the
 * card swaps the input controls for the IngestionResult panel (within the same
 * card — no navigation). "Upload Another Resume" resets ingestion state only.
 */
export function ResumeUploadCard() {
  const selectedFile = useIngestionStore((s) => s.selectedFile);
  const status = useIngestionStore((s) => s.status);
  const isUploading = useIngestionStore((s) => s.isUploading);
  const uploadProgress = useIngestionStore((s) => s.uploadProgress);
  const successResult = useIngestionStore((s) => s.successResult);
  const error = useIngestionStore((s) => s.error);
  const validationError = useIngestionStore((s) => s.validationError);

  const selectFile = useIngestionStore((s) => s.selectFile);
  const startUpload = useIngestionStore((s) => s.startUpload);
  const setUploadProgress = useIngestionStore((s) => s.setUploadProgress);
  const setValidationError = useIngestionStore((s) => s.setValidationError);
  const uploadSucceeded = useIngestionStore((s) => s.uploadSucceeded);
  const uploadFailed = useIngestionStore((s) => s.uploadFailed);
  const reset = useIngestionStore((s) => s.reset);

  async function handleUploadClick() {
    if (isUploading) return;

    // Phase 7: empty-upload guard — block the API call, show the message.
    if (!selectedFile) {
      setValidationError(EMPTY_FILE_MESSAGE);
      return;
    }

    startUpload();
    try {
      const data = await ingestionApi.uploadResume(
        selectedFile,
        setUploadProgress
      );
      uploadSucceeded(data);
    } catch (err) {
      if (err instanceof IngestionApiError) {
        uploadFailed({ message: err.message, code: err.errorCode });
      } else {
        uploadFailed({
          message: "Unexpected error during upload",
          code: "UNKNOWN_ERROR",
        });
      }
    }
  }

  // Result screen (same card) once the backend confirms success.
  if (status === "success" && successResult) {
    return (
      <section className="upload-card" aria-label="Resume ingestion result">
        <IngestionResult
          resumeId={successResult.resumeId}
          timings={successResult.timings}
          onReset={reset}
        />
      </section>
    );
  }

  // Recoverable error screen (same card) on backend/network failure.
  if (status === "error" && error) {
    return (
      <section className="upload-card" aria-label="Resume ingestion error">
        <IngestionError
          code={error.code}
          message={error.message}
          isRetrying={isUploading}
          onRetry={handleUploadClick}
          onChooseAnother={reset}
        />
      </section>
    );
  }

  return (
    <section className="upload-card" aria-label="Resume upload">
      <UploadDropzone selectedFile={selectedFile} onFileSelected={selectFile} />

      <UploadButton isUploading={isUploading} onClick={handleUploadClick} />

      {validationError && (
        <div className="upload-validation" role="alert">
          {validationError}
        </div>
      )}

      <UploadProgress status={status} uploadProgress={uploadProgress} />
    </section>
  );
}

export default ResumeUploadCard;
