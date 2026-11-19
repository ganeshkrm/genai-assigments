import { EmbeddingService } from "../../src/modules/ingestion/services/EmbeddingService";

describe("EmbeddingService (Phase 11) — response validation", () => {
  const service = new EmbeddingService();
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the numeric vector on a valid response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, -0.2, 0.3] }] }),
    }) as unknown as typeof fetch;

    await expect(service.generateEmbedding("text")).resolves.toEqual([
      0.1, -0.2, 0.3,
    ]);
  });

  it("throws on a non-ok API response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
    }) as unknown as typeof fetch;

    await expect(service.generateEmbedding("text")).rejects.toThrow();
  });

  it("throws when the embedding is not a numeric array", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: "not-an-array" }] }),
    }) as unknown as typeof fetch;

    await expect(service.generateEmbedding("text")).rejects.toThrow();
  });

  it("throws when the response has no embedding", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;

    await expect(service.generateEmbedding("text")).rejects.toThrow();
  });

  it("buildEmbeddingInput includes name, skills and rawText", () => {
    const text = service.buildEmbeddingInput({
      name: "Ganesh Kumar Mohan",
      role: "Quality Automation Specialist",
      skills: ["RAG", "DeepEval"],
      company: "Example Corp",
      rawText: "resume body text",
    });
    expect(text).toContain("Ganesh Kumar Mohan");
    expect(text).toContain("RAG, DeepEval");
    expect(text).toContain("resume body text");
  });
});
