"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_VERSION = exports.APP_NAME = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Centralized, typed access to environment configuration.
 * All configuration (including the MongoDB connection string) comes only
 * from environment variables loaded here.
 */
exports.env = {
    PORT: parseInt(process.env.PORT || "3000", 10),
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGODB_URI: process.env.MONGODB_URI || "",
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "resume_rag",
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || "",
    MISTRAL_EMBED_MODEL: process.env.MISTRAL_EMBED_MODEL || "mistral-embed",
    EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || "1024", 10),
    USE_LLM_PARSER: process.env.USE_LLM_PARSER === "true",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    GROQ_MODEL: process.env.GROQ_MODEL || "",
    MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || "5", 10),
    // Retrieval configuration (Phase 2 document)
    RETRIEVAL_DEFAULT_TOP_K: parseInt(process.env.RETRIEVAL_DEFAULT_TOP_K || "20", 10),
    RERANK_DEFAULT_TOP_N: parseInt(process.env.RERANK_DEFAULT_TOP_N || "10", 10),
    SEARCH_P95_TARGET_MS: parseInt(process.env.SEARCH_P95_TARGET_MS || "5000", 10),
    // Collection + Atlas Search index names (configured in MongoDB Atlas)
    COLLECTION_NAME: process.env.COLLECTION_NAME || "resumes",
    VECTOR_INDEX_NAME: process.env.VECTOR_INDEX_NAME || "vector_index",
    BM25_INDEX_NAME: process.env.BM25_INDEX_NAME || "BM25_index",
    // Groq models for retrieval LLM tasks (re-rank / summarize). Fall back to
    // GROQ_MODEL if the task-specific var is unset.
    RERANK_PROVIDER: process.env.RERANK_PROVIDER || "groq",
    RERANK_MODEL: process.env.RERANK_MODEL || process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    SUMMARIZATION_PROVIDER: process.env.SUMMARIZATION_PROVIDER || "groq",
    SUMMARIZATION_MODEL: process.env.SUMMARIZATION_MODEL ||
        process.env.GROQ_MODEL ||
        "openai/gpt-oss-20b",
    // LLM fallback chain (Groq secondary — see deferred-llm-fallback note).
    ENABLE_FALLBACK: process.env.ENABLE_FALLBACK !== "false",
    LLM_FALLBACK_PROVIDER: process.env.LLM_FALLBACK_PROVIDER || "groq",
    LLM_FALLBACK_MODEL: process.env.LLM_FALLBACK_MODEL || "openai/gpt-oss-20b",
    // Token budgeting.
    ENABLE_TOKEN_OPTIMIZATION: process.env.ENABLE_TOKEN_OPTIMIZATION === "true",
    MAX_TOTAL_TOKENS: parseInt(process.env.MAX_TOTAL_TOKENS || "32000", 10),
    MAX_GENERATION_TOKENS: parseInt(process.env.MAX_GENERATION_TOKENS || "4000", 10),
    MAX_SUMMARY_TOKENS: parseInt(process.env.MAX_SUMMARY_TOKENS || "800", 10),
    // Secondary OpenAI-compatible provider (registry extensibility).
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || "",
    NVIDIA_BASE_URL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1/",
};
exports.APP_NAME = "resume-rag-backend";
exports.APP_VERSION = "1.0.0";
//# sourceMappingURL=env.js.map