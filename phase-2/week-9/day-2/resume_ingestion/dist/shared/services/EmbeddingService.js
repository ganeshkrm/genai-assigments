"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
/**
 * Shared Mistral EmbeddingService.
 *
 * Re-exports the already-tested ingestion EmbeddingService so both ingestion
 * (resume embeddings) and retrieval (on-demand query embeddings) use the exact
 * same Mistral client and validation/retry behavior. Kept as a re-export to
 * avoid moving proven code while keeping the test suite green.
 */
var EmbeddingService_1 = require("../../modules/ingestion/services/EmbeddingService");
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return EmbeddingService_1.EmbeddingService; } });
//# sourceMappingURL=EmbeddingService.js.map