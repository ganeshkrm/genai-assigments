"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapResumeToCandidate = mapResumeToCandidate;
/**
 * Map a stored resume document (as projected by the repository search methods)
 * to the normalized SearchCandidate shape (Phase 7).
 *
 * The score is read from the field appropriate to the source:
 *   - "bm25"   -> doc.score        -> candidate.bm25Score
 *   - "vector" -> doc.vectorScore  -> candidate.vectorScore
 */
function round2(n) {
    return Math.round(n * 100) / 100;
}
function mapResumeToCandidate(doc, source) {
    const candidate = {
        resumeId: doc._id.toString(),
        sources: [source],
    };
    if (typeof doc.name === "string")
        candidate.name = doc.name;
    if (typeof doc.role === "string")
        candidate.role = doc.role;
    if (typeof doc.company === "string")
        candidate.company = doc.company;
    if (Array.isArray(doc.skills))
        candidate.skills = doc.skills;
    if (typeof doc.totalExperience === "number") {
        candidate.totalExperience = doc.totalExperience;
    }
    if (typeof doc.snippet === "string" && doc.snippet.trim().length > 0) {
        candidate.snippet = doc.snippet.trim();
    }
    if (source === "bm25" && typeof doc.score === "number") {
        candidate.bm25Score = round2(doc.score);
    }
    if (source === "vector" && typeof doc.vectorScore === "number") {
        candidate.vectorScore = round2(doc.vectorScore);
    }
    return candidate;
}
//# sourceMappingURL=candidateMapper.js.map