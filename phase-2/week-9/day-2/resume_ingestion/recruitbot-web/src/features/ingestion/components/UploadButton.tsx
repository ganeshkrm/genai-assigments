import { Loader2, Upload } from "lucide-react";

/**
 * UploadButton — Phase 7.
 *
 * Remains clickable even with no file so the empty-upload validation message
 * ("Please select a file") can be triggered and the API call blocked. Only
 * disabled while an upload is in flight (prevents double-submit).
 */
interface UploadButtonProps {
  isUploading: boolean;
  onClick: () => void;
}

export function UploadButton({ isUploading, onClick }: UploadButtonProps) {
  const label = isUploading ? "Uploading…" : "Upload Resume";

  return (
    <button
      type="button"
      className="upload-button"
      disabled={isUploading}
      onClick={onClick}
      aria-label={label}
      aria-busy={isUploading}
    >
      {isUploading ? (
        <Loader2
          size={16}
          aria-hidden
          className="upload-spin"
          style={{ verticalAlign: "-3px", marginRight: 8 }}
        />
      ) : (
        <Upload
          size={16}
          aria-hidden
          style={{ verticalAlign: "-3px", marginRight: 8 }}
        />
      )}
      {label}
    </button>
  );
}

export default UploadButton;
