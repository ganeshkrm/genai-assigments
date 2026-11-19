import { LLMService } from "../../src/modules/retrieval/services/LLMService";
import { SearchCandidate } from "../../src/modules/retrieval/types/retrieval.types";

describe("LLMService.rerankCandidates (Phase 10/11) — output schema validation", () => {
  const svc = new LLMService();
  const originalFetch = global.fetch;

  const candidates: SearchCandidate[] = [
    { resumeId: "A", sources: [], snippet: "a" },
    { resumeId: "B", sources: [], snippet: "b" },
  ];

  function mockGroq(content: string) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content } }] }),
    }) as unknown as typeof fetch;
  }

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("drops hallucinated ids not present in the input", async () => {
    mockGroq(
      JSON.stringify({
        results: [
          { resumeId: "A", rank: 1, relevanceScore: 0.9 },
          { resumeId: "HALLUCINATED", rank: 2, relevanceScore: 0.8 },
        ],
      })
    );
    const out = await svc.rerankCandidates("q", candidates, 10);
    expect(out.map((r) => r.resumeId)).toEqual(["A"]);
  });

  it("returns [] for an empty candidate list without calling the LLM", async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;
    const out = await svc.rerankCandidates("q", [], 10);
    expect(out).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws on invalid LLM JSON", async () => {
    mockGroq("this is not json");
    await expect(svc.rerankCandidates("q", candidates, 10)).rejects.toThrow();
  });

  it("sorts by rank and caps at topN", async () => {
    mockGroq(
      JSON.stringify({
        results: [
          { resumeId: "B", rank: 2, relevanceScore: 0.5 },
          { resumeId: "A", rank: 1, relevanceScore: 0.9 },
        ],
      })
    );
    const out = await svc.rerankCandidates("q", candidates, 1);
    expect(out.length).toBe(1);
    expect(out[0].resumeId).toBe("A");
  });
});
