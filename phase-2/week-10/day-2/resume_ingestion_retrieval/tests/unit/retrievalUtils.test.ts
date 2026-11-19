import { deduplicateCandidates } from "../../src/modules/retrieval/utils/deduplicate";
import { mapResumeToCandidate } from "../../src/modules/retrieval/utils/candidateMapper";
import { SearchCandidate } from "../../src/modules/retrieval/types/retrieval.types";

function bm25(id: string, score: number): SearchCandidate {
  return { resumeId: id, sources: ["bm25"], bm25Score: score };
}
function vector(id: string, score: number): SearchCandidate {
  return { resumeId: id, sources: ["vector"], vectorScore: score };
}

describe("deduplicateCandidates (Phase 9 / Phase 15 ordering)", () => {
  it("merges the MD example [A,B,C]+[B,D,A] into A,B,C,D", () => {
    const pool = deduplicateCandidates(
      [bm25("A", 8), bm25("B", 7), bm25("C", 6)],
      [vector("B", 0.9), vector("D", 0.8), vector("A", 0.7)]
    );
    expect(pool.map((p) => p.resumeId)).toEqual(["A", "B", "C", "D"]);
  });

  it("preserves BM25-priority order (fallback ordering)", () => {
    const pool = deduplicateCandidates(
      [bm25("A", 8), bm25("B", 7)],
      [vector("C", 0.9), vector("A", 0.7)]
    );
    // BM25 ids first (A,B), then new vector-only ids (C)
    expect(pool.map((p) => p.resumeId)).toEqual(["A", "B", "C"]);
  });

  it("retains both scores and unions sources for shared candidates", () => {
    const pool = deduplicateCandidates([bm25("A", 8)], [vector("A", 0.7)]);
    const a = pool.find((p) => p.resumeId === "A")!;
    expect(a.sources.sort()).toEqual(["bm25", "vector"]);
    expect(a.bm25Score).toBe(8);
    expect(a.vectorScore).toBe(0.7);
  });

  it("produces no duplicate resumeIds", () => {
    const pool = deduplicateCandidates(
      [bm25("A", 1), bm25("B", 1)],
      [vector("A", 1), vector("B", 1)]
    );
    expect(new Set(pool.map((p) => p.resumeId)).size).toBe(pool.length);
  });
});

describe("mapResumeToCandidate (Phase 7)", () => {
  const doc = {
    _id: "id1",
    name: "Ganesh Kumar Mohan",
    role: "Quality Automation Specialist",
    company: "Example Corp",
    skills: ["RAG", "DeepEval"],
    totalExperience: 14,
    snippet: "snippet text",
    score: 3.25,
    vectorScore: 0.82,
  };

  it("maps a bm25 doc to the normalized shape", () => {
    const c = mapResumeToCandidate(doc, "bm25");
    expect(c.resumeId).toBe("id1");
    expect(c.sources).toEqual(["bm25"]);
    expect(c.bm25Score).toBe(3.25);
    expect(c.vectorScore).toBeUndefined();
    expect(c.totalExperience).toBe(14);
    expect(c.snippet).toBe("snippet text");
  });

  it("maps a vector doc to the normalized shape", () => {
    const c = mapResumeToCandidate(doc, "vector");
    expect(c.sources).toEqual(["vector"]);
    expect(c.vectorScore).toBe(0.82);
    expect(c.bm25Score).toBeUndefined();
  });
});
