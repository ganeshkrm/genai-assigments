import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { APP_NAME, APP_VERSION } from "./config/env";
import { openapiSpec } from "./config/openapi";
import { requestId } from "./middleware/requestId";
import { logger } from "./middleware/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { pingDatabase } from "./config/database";
import ingestionRoutes from "./modules/ingestion/routes/ingestionRoutes";
import retrievalRoutes from "./modules/retrieval/routes/retrievalRoutes";

const app = express();

// Core middleware
app.use(cors());
// Enforce a request body size limit (Phase 17); oversized payloads -> 413.
app.use(express.json({ limit: "1mb" }));
app.use(requestId);
app.use(logger);

// Swagger UI (browser API explorer) + raw spec.
app.get("/openapi.json", (_req: Request, res: Response) => {
  res.json(openapiSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

/**
 * Phase 1 — Health endpoint.
 * GET /v1/health
 */
app.get("/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    app: APP_NAME,
    version: APP_VERSION,
    uptime: process.uptime(),
  });
});

/**
 * Phase 2 — Database connectivity health.
 * GET /v1/health/db
 */
app.get("/v1/health/db", async (_req: Request, res: Response) => {
  try {
    const latencyMs = await pingDatabase();
    res.status(200).json({
      status: "ok",
      database: "mongodb",
      connected: true,
      latencyMs,
    });
  } catch (_err) {
    res.status(503).json({
      status: "error",
      database: "mongodb",
      connected: false,
      errorCode: "DB_CONNECTION_FAILED",
    });
  }
});

// Ingestion module routes (Phase 3 onward)
app.use("/v1", ingestionRoutes);

// Retrieval module routes (Retrieval Phase 1 onward)
app.use("/v1", retrievalRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
