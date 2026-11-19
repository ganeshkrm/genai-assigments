"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionErrors = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
/**
 * Application error carrying a stable HTTP status and error code.
 * Later ingestion phases throw this with the codes defined in the
 * architecture (Phase 14) so every endpoint returns controlled errors.
 */
class AppError extends Error {
    constructor(statusCode, errorCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
/**
 * Centralized ingestion error catalog (Phase 14) — the single source of truth
 * for stable error codes, HTTP statuses and messages across all endpoints.
 *
 * The first seven map exactly to the architecture's Phase-14 error table.
 * VALIDATION_ERROR (JSON-body validation) and LLM_PARSER_DISABLED (parser
 * feature flag) are supplementary codes not in that table.
 */
exports.IngestionErrors = {
    // --- Phase-14 error table ---
    fileRequired: () => new AppError(400, "FILE_REQUIRED", "Resume PDF is required"),
    invalidFileType: () => new AppError(415, "INVALID_FILE_TYPE", "Only PDF files are allowed"),
    fileTooLarge: () => new AppError(413, "FILE_TOO_LARGE", "Resume exceeds maximum upload size"),
    extractionFailed: () => new AppError(422, "RESUME_EXTRACTION_FAILED", "Resume extraction failed"),
    parseFailed: () => new AppError(422, "RESUME_PARSE_FAILED", "Resume parsing failed"),
    embeddingFailed: () => new AppError(502, "EMBEDDING_FAILED", "Mistral embedding failed"),
    ingestionFailed: () => new AppError(500, "INGESTION_FAILED", "Resume ingestion failed"),
    // --- Supplementary (not in the Phase-14 table) ---
    validation: (message) => new AppError(400, "VALIDATION_ERROR", message),
    llmParserDisabled: () => new AppError(403, "LLM_PARSER_DISABLED", "LLM resume parser is disabled"),
};
/**
 * Central error handler. Produces the standard error response shape:
 * { success, requestId, errorCode, message }.
 */
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    const requestId = req.requestId;
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            requestId,
            errorCode: err.errorCode,
            message: err.message,
        });
        return;
    }
    // Oversized JSON body (body-parser) -> 413 (Phase 17 retrieval).
    const anyErr = err;
    if (anyErr.type === "entity.too.large" || anyErr.status === 413) {
        res.status(413).json({
            success: false,
            requestId,
            errorCode: "PAYLOAD_TOO_LARGE",
            message: "Request body exceeds the maximum allowed size",
        });
        return;
    }
    console.error(JSON.stringify({ requestId, errorCode: "INTERNAL_ERROR", message: err.message }));
    res.status(500).json({
        success: false,
        requestId,
        errorCode: "INTERNAL_ERROR",
        message: "Internal server error",
    });
}
/**
 * 404 handler for unmatched routes.
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        requestId: req.requestId,
        errorCode: "NOT_FOUND",
        message: "Resource not found",
    });
}
//# sourceMappingURL=errorHandler.js.map