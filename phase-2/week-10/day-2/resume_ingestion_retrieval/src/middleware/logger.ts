import { Request, Response, NextFunction } from "express";

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
export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const requestTotalMs = Date.now() - start;
    const context = (res.locals.logContext as Record<string, unknown>) || {};

    const logLine: Record<string, unknown> = {
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
