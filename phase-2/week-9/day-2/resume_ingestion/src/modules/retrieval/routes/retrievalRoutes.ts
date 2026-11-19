import { Router } from "express";
import { retrievalController } from "../controllers/retrievalController";

/**
 * Retrieval module routes. Mounted under "/v1" in app.ts, so paths below
 * resolve to /v1/search/... .
 *
 * Phase 1: readiness check only. Search routes are added in later phases.
 */
const router = Router();

// GET /v1/search/readiness
router.get("/search/readiness", retrievalController.readiness);

// POST /v1/embeddings — on-demand query embedding (Phase 3)
router.post("/embeddings", retrievalController.embeddings);

// POST /v1/search/bm25 — lexical BM25 search (Phase 5)
router.post("/search/bm25", retrievalController.bm25);

// POST /v1/search/vector — semantic vector search (Phase 6)
router.post("/search/vector", retrievalController.vector);

// POST /v1/search/hybrid — parallel BM25 + vector, separate scores (Phase 8)
router.post("/search/hybrid", retrievalController.hybrid);

// POST /v1/search/rerank — LLM re-ranking of supplied candidates (Phase 11)
router.post("/search/rerank", retrievalController.rerank);

// POST /v1/search/summarize — optional candidate-fit summary (Phase 12)
router.post("/search/summarize", retrievalController.summarize);

// POST /v1/search — full end-to-end search pipeline (Phase 14)
router.post("/search", retrievalController.search);

// GET /v1/candidate/:id — read-only full candidate profile (frontend modal)
router.get("/candidate/:id", retrievalController.candidate);

export default router;
