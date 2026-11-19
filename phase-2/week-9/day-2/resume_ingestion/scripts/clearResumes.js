/**
 * Dev utility: delete all documents in the `resumes` collection.
 *
 * Not part of the ingestion pipeline — a maintenance helper for clearing
 * test data between runs. Uses the same MONGODB_URI / MONGODB_DB_NAME from
 * .env as the backend.
 *
 * Usage:
 *   npm run clean:resumes
 *   npm run clean:resumes -- --yes     (skip the confirmation prompt)
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "resume_rag";

  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection("resumes");
    const before = await collection.countDocuments();

    if (before === 0) {
      console.log(`'${dbName}.resumes' is already empty. Nothing to delete.`);
      return;
    }

    const result = await collection.deleteMany({});
    console.log(
      `Cleared '${dbName}.resumes': deleted ${result.deletedCount} of ${before} document(s).`
    );
  } catch (err) {
    console.error("Cleanup failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
