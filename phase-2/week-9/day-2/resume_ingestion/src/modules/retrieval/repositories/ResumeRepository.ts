import { Document, ObjectId } from "mongodb";
import { getResumesCollection } from "../../../config/database";
import { env } from "../../../config/env";

// BM25 search fields (per the retrieval MD). Only fields present in both the
// Atlas Search index and the stored documents contribute matches; others are
// ignored by Atlas, so this list is forward-compatible if the index is widened.
const BM25_FIELDS = [
  "rawText",
  "skills",
  "jobTitles",
  "experienceSummary",
  "role",
  "company",
];

/**
 * Retrieval-only database access over the existing `resumes` collection
 * (Phase 4). Read-only: never mutates ingestion records during normal search.
 *
 * BM25 (Atlas Search) and vector ($vectorSearch) aggregation queries are added
 * to this repository in Phases 5 and 6. This phase provides the foundational
 * reads used to fetch candidates/snippets for LLM re-ranking.
 */
export class ResumeRepository {
  // Exclude the large embedding vector from candidate reads by default.
  private readonly candidateProjection = { embedding: 0 } as const;

  /** Fetch a single resume by its string _id (null if not found/invalid). */
  async findById(id: string): Promise<Document | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return getResumesCollection().findOne(
      { _id: new ObjectId(id) },
      { projection: this.candidateProjection }
    );
  }

  /** Fetch multiple resumes by id (for snippet/candidate hydration). */
  async findByIds(ids: string[]): Promise<Document[]> {
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    if (objectIds.length === 0) {
      return [];
    }
    return getResumesCollection()
      .find(
        { _id: { $in: objectIds } },
        { projection: this.candidateProjection }
      )
      .toArray();
  }

  /**
   * Lexical (BM25) search via Atlas Search (Phase 5). Returns matching resume
   * documents with a `score` ($meta searchScore), optionally filtered by a
   * minimum total experience, limited to topK. Does not call the LLM.
   */
  async bm25Search(
    query: string,
    minYearsExperience: number | undefined,
    topK: number
  ): Promise<Document[]> {
    const pipeline: Document[] = [
      {
        $search: {
          index: env.BM25_INDEX_NAME,
          text: { query, path: BM25_FIELDS },
        },
      },
    ];

    if (typeof minYearsExperience === "number") {
      pipeline.push({
        $match: { totalExperience: { $gte: minYearsExperience } },
      });
    }

    pipeline.push(
      { $limit: topK },
      {
        $project: {
          name: 1,
          role: 1,
          company: 1,
          skills: 1,
          totalExperience: 1,
          snippet: { $substrCP: [{ $ifNull: ["$rawText", ""] }, 0, 400] },
          score: { $meta: "searchScore" },
        },
      }
    );

    return getResumesCollection().aggregate(pipeline).toArray();
  }

  /**
   * Semantic (vector) search via Atlas Vector Search (Phase 6). Takes a 1024-d
   * query vector and returns the nearest resumes with a `vectorScore`
   * ($meta vectorSearchScore), limited to topK.
   */
  async vectorSearch(
    queryVector: number[],
    topK: number
  ): Promise<Document[]> {
    const numCandidates = Math.min(Math.max(topK * 10, 150), 1000);

    const pipeline: Document[] = [
      {
        $vectorSearch: {
          index: env.VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates,
          limit: topK,
        },
      },
      {
        $project: {
          name: 1,
          role: 1,
          company: 1,
          skills: 1,
          totalExperience: 1,
          snippet: { $substrCP: [{ $ifNull: ["$rawText", ""] }, 0, 400] },
          vectorScore: { $meta: "vectorSearchScore" },
        },
      },
    ];

    return getResumesCollection().aggregate(pipeline).toArray();
  }
}
