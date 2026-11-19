"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = logger;
/**
 * Lightweight structured request logger (Phase 15).
 *
 * Logs one JSON line per completed request: requestId, endpoint, method,
 * statusCode and totalMs. Handlers may attach extra context (e.g. fileName
 * and per-stage ingestion timings) via `res.locals.logContext`, which is
 * merged into the log line.
 *
 * Secrets, full embedding vectors and raw request payloads are never logged.
 */
function logger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const requestTotalMs = Date.now() - start;
        const context = res.locals.logContext || {};
        const logLine = {
            requestId: req.requestId,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            ...context,
        };
        // Prefer handler-provided totalMs (e.g. pipeline timings); otherwise use
        // the measured request duration.
        if (logLine.totalMs === undefined) {
            logLine.totalMs = requestTotalMs;
        }
        console.log(JSON.stringify(logLine));
    });
    next();
}
//# sourceMappingURL=logger.js.map