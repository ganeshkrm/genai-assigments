// Mock the shared database module so no real MongoDB connection is used.
jest.mock("../../src/config/database", () => ({
  getResumesCollection: jest.fn(),
}));

import { getResumesCollection } from "../../src/config/database";
import {
  ResumeIngestionRepository,
  buildResumeDocument,
} from "../../src/modules/ingestion/repositories/ResumeIngestionRepository";

describe("ResumeIngestionRepository (Phase 12)", () => {
  const mockedGetCollection = getResumesCollection as jest.Mock;

  afterEach(() => jest.clearAllMocks());

  it("insertResume calls insertOne once and returns the id as a string", async () => {
    const insertOne = jest
      .fn()
      .mockResolvedValue({ insertedId: { toString: () => "abc123" } });
    mockedGetCollection.mockReturnValue({ insertOne });

    const repo = new ResumeIngestionRepository();
    const id = await repo.insertResume({ fileName: "x.pdf" });

    expect(insertOne).toHaveBeenCalledTimes(1);
    expect(id).toBe("abc123");
  });

  it("buildResumeDocument produces the recommended shape", () => {
    const doc = buildResumeDocument({
      fileName: "resume.pdf",
      resume: {
        name: "Ganesh Kumar Mohan",
        role: "Quality Automation Specialist",
        skills: ["RAG", "DeepEval"],
      },
      rawText: "cleaned text",
      embedding: [0.1, 0.2, 0.3],
    });

    expect(doc.fileName).toBe("resume.pdf");
    expect(doc.name).toBe("Ganesh Kumar Mohan");
    expect(doc.email).toBeNull(); // absent -> null, not invented
    expect(doc.skills).toEqual(["RAG", "DeepEval"]);
    expect(doc.jobTitles).toEqual([]);
    expect(doc.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(doc.embeddingModel).toBe("mistral-embed");
    expect(doc.embeddingDimension).toBe(3);
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });
});
