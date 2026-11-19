/**
 * Shared Mistral EmbeddingService.
 *
 * Re-exports the already-tested ingestion EmbeddingService so both ingestion
 * (resume embeddings) and retrieval (on-demand query embeddings) use the exact
 * same Mistral client and validation/retry behavior. Kept as a re-export to
 * avoid moving proven code while keeping the test suite green.
 */
export {
  EmbeddingService,
  type EmbeddingInputFields,
} from "../../modules/ingestion/services/EmbeddingService";
