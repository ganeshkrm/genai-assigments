import app from "./app";
import { env, APP_NAME } from "./config/env";
import { connectToDatabase } from "./config/database";

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
    await connectToDatabase();
    console.log(
      JSON.stringify({ message: "MongoDB connected", db: env.MONGODB_DB_NAME })
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "MongoDB connection failed at startup",
        errorCode: "DB_CONNECTION_FAILED",
        error: (err as Error).message,
      })
    );
  }

  app.listen(env.PORT, () => {
    console.log(
      JSON.stringify({
        message: `${APP_NAME} listening`,
        port: env.PORT,
        env: env.NODE_ENV,
      })
    );
  });
}

start();
// reload env (mistral key)
