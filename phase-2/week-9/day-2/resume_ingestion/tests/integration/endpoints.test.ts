import path from "path";
import request from "supertest";
import { ObjectId } from "mongodb";
import app from "../../src/app";
import {
  connectToDatabase,
  closeDatabase,
  getResumesCollection,
} from "../../src/config/database";
import { ResumeParserService } from "../../src/modules/ingestion/services/ResumeParserService";

const FIXTURES = path.join(__dirname, "..", "fixtures");

// Realistic extracted-resume text used where PDF extraction is mocked.
const RESUME_TEXT = [
  "Ganesh Kumar Mohan",
  "Quality Automation Specialist, AVP",
  "Cypress Selenium WebDriver Core Java C# Python RAG DeepEval",
  "MCP (Model Context Protocol)",
  "14 plus years of experience in IT industry",
].join("\n");

/**
 * Integration + E2E tests (Phase 16).
 * Runs the Express app in-process (supertest) against the real MongoDB and
 * Mistral endpoints configured in .env. No separate `npm run dev` is needed.
 *
 * NOTE: pdfjs (used by pdf-parse) sets up its worker via a dynamic import that
 * Jest's CommonJS VM sandbox forbids ("dynamic import ... without
 * --experimental-vm-modules"). Real PDF text extraction is therefore verified
 * outside Jest (plain Node + live HTTP/Postman). Here we mock only that one
 * fragile step via ResumeParserService.extractTextFromPdf, so the rest of the
 * pipeline (routing, multer, clean, parse, real Mistral embedding, real Mongo
 * storage, E2E verification) is exercised for real.
 */
let extractSpy: jest.SpyInstance;

beforeAll(async () => {
  await connectToDatabase();
  extractSpy = jest.spyOn(
    ResumeParserService.prototype,
    "extractTextFromPdf"
  );
}, 30000);

afterAll(async () => {
  extractSpy.mockRestore();
  await closeDatabase();
});

describe("integration — health", () => {
  it("GET /v1/health -> 200 ok", async () => {
    const res = await request(app).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.app).toBe("resume-rag-backend");
  });

  it("GET /v1/health/db -> 200 connected", async () => {
    const res = await request(app).get("/v1/health/db");
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(typeof res.body.latencyMs).toBe("number");
  });
});

describe("integration — ingestion endpoints", () => {
  it("rejects a non-PDF upload with 415 INVALID_FILE_TYPE", async () => {
    const res = await request(app)
      .post("/v1/resume/inject")
      .attach("file", path.join(FIXTURES, "notes.txt"));
    expect(res.status).toBe(415);
    expect(res.body.errorCode).toBe("INVALID_FILE_TYPE");
  });

  it("extracts text from a PDF", async () => {
    extractSpy.mockResolvedValueOnce(RESUME_TEXT);
    const res = await request(app)
      .post("/v1/resume/extract")
      .attach("file", path.join(FIXTURES, "resume.pdf"));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rawText).toContain("Ganesh Kumar Mohan");
    expect(res.body.characters).toBeGreaterThan(0);
  });

  it("returns 422 RESUME_EXTRACTION_FAILED for a no-text PDF", async () => {
    extractSpy.mockResolvedValueOnce(""); // simulate empty extraction
    const res = await request(app)
      .post("/v1/resume/extract")
      .attach("file", path.join(FIXTURES, "empty.pdf"));
    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe("RESUME_EXTRACTION_FAILED");
  });

  it("parses cleaned text into structured JSON", async () => {
    const res = await request(app)
      .post("/v1/resume/parse")
      .send({
        rawText:
          "Ganesh Kumar Mohan\nQuality Automation Specialist\nPython RAG DeepEval",
      });
    expect(res.status).toBe(200);
    expect(res.body.resume.name).toBe("Ganesh Kumar Mohan");
    expect(res.body.resume.skills).toEqual(
      expect.arrayContaining(["Python", "RAG", "DeepEval"])
    );
  });

  it("generates a 1024-dim Mistral embedding", async () => {
    const res = await request(app)
      .post("/v1/resume/embed")
      .send({
        name: "Ganesh Kumar Mohan",
        role: "Quality Automation Specialist",
        skills: ["RAG", "DeepEval"],
        rawText: "Quality automation, Python, RAG, DeepEval, 14 plus years.",
      });
    expect(res.status).toBe(200);
    expect(res.body.model).toBe("mistral-embed");
    expect(res.body.dimension).toBe(1024);
    expect(res.body.embedding).toHaveLength(1024);
  }, 30000);

  it("stores a resume document and returns a resumeId", async () => {
    const res = await request(app)
      .post("/v1/resume/store")
      .send({
        fileName: "integration-test.pdf",
        resume: { name: "Ganesh Kumar Mohan", skills: ["RAG"] },
        rawText: "cleaned resume text",
        embedding: [0.1, 0.2, 0.3],
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.resumeId).toBe("string");
  });
});

describe("E2E — full ingestion pipeline", () => {
  it("POST /v1/resume/inject stores a complete record with a 1024-dim embedding", async () => {
    extractSpy.mockResolvedValueOnce(RESUME_TEXT);
    const res = await request(app)
      .post("/v1/resume/inject")
      .attach("file", path.join(FIXTURES, "resume.pdf"));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.resumeId).toBe("string");
    expect(res.body.data.embeddingDimension).toBe(1024);
    expect(res.body.data.embeddingModel).toBe("mistral-embed");
    expect(res.body.timings.totalMs).toBeGreaterThan(0);

    // Verify the stored MongoDB document.
    const doc = await getResumesCollection().findOne({
      _id: new ObjectId(res.body.resumeId),
    });
    expect(doc).toBeTruthy();
    expect(doc!.name).toBe("Ganesh Kumar Mohan");
    expect(Array.isArray(doc!.skills)).toBe(true);
    expect(doc!.embedding).toHaveLength(1024);
  }, 30000);
});
