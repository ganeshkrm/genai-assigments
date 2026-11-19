import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL, API_TIMEOUT } from "@/config/api.config";
import type { ApiError } from "@/types/api.types";

/**
 * Shared Axios instance for the retrieval API (Phase 10).
 *
 * Talks to the real backend (open CORS) on VITE_API_BASE_URL. The ingestion
 * feature keeps its own service and is NOT routed through here, so the two
 * API surfaces stay independent (guard rule 10).
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — tag each request with a correlation id.
apiClient.interceptors.request.use(
  (config) => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      config.headers["X-Request-ID"] = crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — surface backend/network errors as toasts.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message || "An error occurred";
      if (status === 404) toast.error(`Not found: ${message}`);
      else if (status >= 500) toast.error("Server error. Please try again later.");
      else toast.error(message);
    } else if (error.request) {
      toast.error("Network error. Check your connection.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
