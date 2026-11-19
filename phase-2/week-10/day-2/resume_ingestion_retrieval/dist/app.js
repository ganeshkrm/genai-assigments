"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const openapi_1 = require("./config/openapi");
const requestId_1 = require("./middleware/requestId");
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = require("./config/database");
const ingestionRoutes_1 = __importDefault(require("./modules/ingestion/routes/ingestionRoutes"));
const retrievalRoutes_1 = __importDefault(require("./modules/retrieval/routes/retrievalRoutes"));
const app = (0, express_1.default)();
// Core middleware
app.use((0, cors_1.default)());
// Enforce a request body size limit (Phase 17); oversized payloads -> 413.
app.use(express_1.default.json({ limit: "1mb" }));
app.use(requestId_1.requestId);
app.use(logger_1.logger);
// Swagger UI (browser API explorer) + raw spec.
app.get("/openapi.json", (_req, res) => {
    res.json(openapi_1.openapiSpec);
});
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openapiSpec));
/**
 * Phase 1 — Health endpoint.
 * GET /v1/health
 */
app.get("/v1/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        app: env_1.APP_NAME,
        version: env_1.APP_VERSION,
        uptime: process.uptime(),
    });
});
/**
 * Phase 2 — Database connectivity health.
 * GET /v1/health/db
 */
app.get("/v1/health/db", async (_req, res) => {
    try {
        const latencyMs = await (0, database_1.pingDatabase)();
        res.status(200).json({
            status: "ok",
            database: "mongodb",
            connected: true,
            latencyMs,
        });
    }
    catch (_err) {
        res.status(503).json({
            status: "error",
            database: "mongodb",
            connected: false,
            errorCode: "DB_CONNECTION_FAILED",
        });
    }
});
// Ingestion module routes (Phase 3 onward)
app.use("/v1", ingestionRoutes_1.default);
// Retrieval module routes (Retrieval Phase 1 onward)
app.use("/v1", retrievalRoutes_1.default);
// Fallback handlers
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map