import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import type {
  BackendErrorResponse,
  InjectSuccessResponse,
} from "../types/ingestion.types";

/**
 * Ingestion API service (Phase 3).
 *
 * Single place that owns the HTTP call to the EXISTING backend endpoint
 * `POST /v1/resume/inject`. UI components must call this service and never
 * build their own axios/fetch requests (API Integration Rules, Phase 3).
 *
 * The backend enables open CORS, so the frontend talks to it directly via
 * VITE_API_BASE_URL (defaults to the local dev backend on :3000). The request
 * contract is NOT altered from the frontend: the PDF is sent as
 * multipart/form-data under the field name `file` (the name multer expects).
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/** Multipart field name expected by the backend's multer middleware. */
const FILE_FIELD = "file";

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

/** Raised when the backend responds with a controlled error payload. */
export class IngestionApiError extends Error {
  errorCode: string;
  statusCode?: number;

  constructor(message: string, errorCode: string, statusCode?: number) {
    super(message);
    this.name = "IngestionApiError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

/**
 * Upload a PDF resume through the full ingestion pipeline.
 * Resolves with the real backend success payload; rejects with an
 * IngestionApiError that carries the backend's errorCode/message (or a
 * network-error marker) so the UI can reflect the true outcome.
 */
export async function uploadResume(
  file: File,
  onUploadProgress?: (percent: number) => void
): Promise<InjectSuccessResponse> {
  const formData = new FormData();
  formData.append(FILE_FIELD, file);

  try {
    const res = await client.post<InjectSuccessResponse>(
      "/v1/resume/inject",
      formData,
      {
        // Real byte-upload progress for the "Resume Upload" stage (Phase 5).
        // Note: do NOT set Content-Type manually — the browser adds the
        // multipart boundary automatically for FormData.
        onUploadProgress: (e) => {
          if (!onUploadProgress) return;
          const pct = e.total
            ? Math.round((e.loaded / e.total) * 100)
            : 0;
          onUploadProgress(pct);
        },
      }
    );
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<BackendErrorResponse>;

    if (axiosErr.response) {
      const body = axiosErr.response.data;
      throw new IngestionApiError(
        body?.message || "Ingestion failed",
        body?.errorCode || "INGESTION_FAILED",
        axiosErr.response.status
      );
    }

    if (axiosErr.request) {
      throw new IngestionApiError(
        "Network error. Check that the backend is running on port 3000.",
        "NETWORK_ERROR"
      );
    }

    throw new IngestionApiError(
      axiosErr.message || "Unexpected error",
      "UNKNOWN_ERROR"
    );
  }
}

export const ingestionApi = { uploadResume };
