import { useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";

/**
 * UploadDropzone — Phase 2 UI shell.
 *
 * Drag-and-drop + click-to-browse surface for selecting a PDF.
 * Phase 2 only surfaces the selection (filename / ready state). It does NOT
 * validate size/type beyond the file picker's accept filter (full validation
 * arrives in Phase 7) and does NOT submit anything to the API (Phase 3).
 */
interface UploadDropzoneProps {
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
}

export function UploadDropzone({
  selectedFile,
  onFileSelected,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) onFileSelected(file);
  }

  const dropzoneClass = [
    "upload-dropzone",
    isDragging ? "is-dragging" : "",
    selectedFile ? "has-file" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={dropzoneClass}
      role="button"
      tabIndex={0}
      aria-label="Drag and drop a PDF resume here, or click to browse"
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
      />

      {selectedFile ? (
        <div className="upload-selected">
          <FileText size={18} aria-hidden />
          <span>{selectedFile.name}</span>
          <span className="upload-selected-meta">
            ({(selectedFile.size / 1024).toFixed(0)} KB) · ready
          </span>
        </div>
      ) : (
        <>
          <UploadCloud
            className="upload-dropzone-icon"
            size={34}
            aria-hidden
          />
          <p className="upload-dropzone-title">Drag &amp; drop your PDF here</p>
          <p className="upload-dropzone-hint">or click to browse / select PDF</p>
        </>
      )}
    </div>
  );
}

export default UploadDropzone;
