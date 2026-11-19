import { MongoClient, Db, Collection, Document } from "mongodb";
import { env } from "./env";

/**
 * Single shared MongoDB connection for the whole backend.
 *
 * The client is created once and reused — ingestion and retrieval both
 * draw their database handle from here, and no connection is recreated
 * per request. The connection string comes only from `.env`.
 */
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db(env.MONGODB_DB_NAME);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db;
}

/**
 * Convenience accessor for the shared `resumes` collection.
 */
export function getResumesCollection(): Collection<Document> {
  return getDb().collection("resumes");
}

/**
 * Ping the database and return the round-trip latency in milliseconds.
 * Reuses the shared connection; connects once if not yet connected.
 */
export async function pingDatabase(): Promise<number> {
  const database = db ?? (await connectToDatabase());
  const start = Date.now();
  await database.command({ ping: 1 });
  return Date.now() - start;
}

export function isConnected(): boolean {
  return db !== null;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
