import request from "supertest";
import app from "../../src/app";
import { connectToDatabase, closeDatabase } from "../../src/config/database";

/**
 * Retrieval integration + E2E tests (Phase 18).
 * Runs the app in-process (supertest) against the real MongoDB Atlas indexes,
 * Mistral embeddings and Groq LLM configured in .env. No separate server.
 */
beforeAll(async () => {
  await connectToDatabase();
}, 30000);

afterAll(async () => {
  await closeDatabase();
});

describe("retrieval integration", () => {
  it("GET /v1/search/readiness -> ready", async () => {
    const res = await request(app).get("/v1/search/readiness");
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.embeddingDimension).toBe(1024);
  });

  it("POST /v1/embeddings -> 1024-dim query vector", async () => {
    const res = await request(app)
      .post("/v1/embeddings")
      .send({ input: "senior QA automation engineer" });
    expect(res.status).toBe(200);
    expect(res.body.dimension).toBe(1024);
    expect(res.body.embedding).toHaveLength(1024);
  }, 30000);

  it("POST /v1/search/bm25 -> ranked results", async () => {
    const res = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "RAG DeepEval Selenium Java", topK: 5 });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("bm25");
    expect(Array.isArray(res.body.results)).toBe(true);
  }, 30000);

  it("POST /v1/search/vector -> semantic results", async () => {
    const res = await request(app)
      .post("/v1/search/vector")
      .send({ query: "engineer who built RAG and LLM evaluation", topK: 5 });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("vector");
    expect(Array.isArray(res.body.results)).toBe(true);
  }, 30000);

  it("POST /v1/search/hybrid -> both lists + timings", async () => {
    const res = await request(app)
      .post("/v1/search/hybrid")
      .send({ query: "RAG MCP QA", topK: 5 });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("hybrid-debug");
    expect(Array.isArray(res.body.bm25)).toBe(true);
    expect(Array.isArray(res.body.vector)).toBe(true);
    expect(typeof res.body.timings.vectorMs).toBe("number");
  }, 30000);

  it("POST /v1/search/rerank -> ids are a subset of input", async () => {
    const res = await request(app)
      .post("/v1/search/rerank")
      .send({
        query: "senior QA with RAG",
        candidates: [
          { resumeId: "cand-a", snippet: "14 years, RAG, DeepEval, MCP" },
          { resumeId: "cand-b", snippet: "fresher, manual testing" },
        ],
        topK: 5,
      });
    expect(res.status).toBe(200);
    const inputIds = new Set(["cand-a", "cand-b"]);
    expect(res.body.results.every((r: { resumeId: string }) => inputIds.has(r.resumeId))).toBe(true);
  }, 30000);

  it("POST /v1/search/summarize -> grounded summary", async () => {
    const res = await request(app)
      .post("/v1/search/summarize")
      .send({
        query: "QA architect with RAG",
        candidate: { resumeId: "cand-a", snippet: "14 years, RAG, DeepEval, MCP" },
        style: "short",
      });
    expect(res.status).toBe(200);
    expect(res.body.resumeId).toBe("cand-a");
    expect(typeof res.body.summary).toBe("string");
    expect(res.body.summary.length).toBeGreaterThan(0);
  }, 30000);

  it("rejects an empty query with 400 INVALID_SEARCH_QUERY", async () => {
    const res = await request(app).post("/v1/search").send({ query: "" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });
});

describe("retrieval E2E — POST /v1/search", () => {
  it("returns ranked results with sources and valid rank", async () => {
    const res = await request(app)
      .post("/v1/search")
      .send({
        query: "Senior QA architect with RAG, DeepEval and MCP experience",
        options: { finalTopK: 3, summarize: false },
      });
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    const top = res.body.results[0];
    expect(top.rank).toBe(1);
    expect(Array.isArray(top.sources)).toBe(true);
    expect(
      top.sources.includes("bm25") || top.sources.includes("vector")
    ).toBe(true);
    expect(res.body.degraded).toBe(false);
    expect(typeof res.body.timings.totalMs).toBe("number");
  }, 45000);
});
