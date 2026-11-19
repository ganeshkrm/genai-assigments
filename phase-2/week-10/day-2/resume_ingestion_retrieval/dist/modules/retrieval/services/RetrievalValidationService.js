"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalValidationService = void 0;
const database_1 = require("../../../config/database");
const env_1 = require("../../../config/env");
class RetrievalValidationService {
    async checkReadiness() {
        const collection = (0, database_1.getResumesCollection)();
        const resumeCount = await collection.countDocuments({});
        const resumesWithEmbedding = await collection.countDocuments({
            embedding: { $exists: true, $not: { $size: 0 } },
            embeddingDimension: env_1.env.EMBEDDING_DIMENSION,
        });
        const ready = resumeCount > 0 && resumesWithEmbedding > 0;
        if (!ready) {
            return {
                ready: false,
                reason: "No ingested resume embeddings are available",
            };
        }
        return {
            ready: true,
            collection: "resumes",
            resumeCount,
            resumesWithEmbedding,
            embeddingModel: env_1.env.MISTRAL_EMBED_MODEL,
            embeddingDimension: env_1.env.EMBEDDING_DIMENSION,
        };
    }
}
exports.RetrievalValidationService = RetrievalValidationService;
//# sourceMappingURL=RetrievalValidationService.js.map