/** Central API configuration (env-driven). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const APP_NAME = import.meta.env.VITE_APP_NAME || "RecruitBot";

/** API request timeout (ms). Retrieval runs embeddings + LLM, so allow room. */
export const API_TIMEOUT = 60000;
