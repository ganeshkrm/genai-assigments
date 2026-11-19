"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getDb = getDb;
exports.getResumesCollection = getResumesCollection;
exports.pingDatabase = pingDatabase;
exports.isConnected = isConnected;
exports.closeDatabase = closeDatabase;
const mongodb_1 = require("mongodb");
const env_1 = require("./env");
/**
 * Single shared MongoDB connection for the whole backend.
 *
 * The client is created once and reused — ingestion and retrieval both
 * draw their database handle from here, and no connection is recreated
 * per request. The connection string comes only from `.env`.
 */
let client = null;
let db = null;
async function connectToDatabase() {
    if (db) {
        return db;
    }
    client = new mongodb_1.MongoClient(env_1.env.MONGODB_URI);
    await client.connect();
    db = client.db(env_1.env.MONGODB_DB_NAME);
    return db;
}
function getDb() {
    if (!db) {
        throw new Error("Database not connected. Call connectToDatabase() first.");
    }
    return db;
}
/**
 * Convenience accessor for the shared `resumes` collection.
 */
function getResumesCollection() {
    return getDb().collection("resumes");
}
/**
 * Ping the database and return the round-trip latency in milliseconds.
 * Reuses the shared connection; connects once if not yet connected.
 */
async function pingDatabase() {
    const database = db ?? (await connectToDatabase());
    const start = Date.now();
    await database.command({ ping: 1 });
    return Date.now() - start;
}
function isConnected() {
    return db !== null;
}
async function closeDatabase() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}
//# sourceMappingURL=database.js.map