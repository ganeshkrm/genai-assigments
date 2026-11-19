"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
/**
 * Single backend server for the Resume RAG application.
 * Hosts both ingestion (Phase 1 onward) and, later, retrieval —
 * all from this one process started with `npm run dev`.
 */
async function start() {
    // Establish the shared MongoDB connection once at startup so it is
    // reused across all requests. A failure here is logged but does not
    // crash the process — /v1/health/db will report the failure instead.
    try {
        await (0, database_1.connectToDatabase)();
        console.log(JSON.stringify({ message: "MongoDB connected", db: env_1.env.MONGODB_DB_NAME }));
    }
    catch (err) {
        console.error(JSON.stringify({
            message: "MongoDB connection failed at startup",
            errorCode: "DB_CONNECTION_FAILED",
            error: err.message,
        }));
    }
    app_1.default.listen(env_1.env.PORT, () => {
        console.log(JSON.stringify({
            message: `${env_1.APP_NAME} listening`,
            port: env_1.env.PORT,
            env: env_1.env.NODE_ENV,
        }));
    });
}
start();
// reload env (mistral key)
//# sourceMappingURL=server.js.map