"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const retrievalController_1 = require("../controllers/retrievalController");
/**
 * Retrieval module routes. Mounted under "/v1" in app.ts, so paths below
 * resolve to /v1/search/... .
 *
 * Phase 1: readiness check only. Search routes are added in later phases.
 */
const router = (0, express_1.Router)();
// GET /v1/search/readiness
router.get("/search/readiness", retrievalController_1.retrievalController.readiness);
// POST /v1/embeddings — on-demand query embedding (Phase 3)
router.post("/embeddings", retrievalController_1.retrievalController.embeddings);
// POST /v1/search/bm25 — lexical BM25 search (Phase 5)
router.post("/search/bm25", retrievalController_1.retrievalController.bm25);
// POST /v1/search/vector — semantic vector search (Phase 6)
router.post("/search/vector", retrievalController_1.retrievalController.vector);
// POST /v1/search/hybrid — parallel BM25 + vector, separate scores (Phase 8)
router.post("/search/hybrid", retrievalController_1.retrievalController.hybrid);
// POST /v1/search/rerank — LLM re-ranking of supplied candidates (Phase 11)
router.post("/search/rerank", retrievalController_1.retrievalController.rerank);
// POST /v1/search/summarize — optional candidate-fit summary (Phase 12)
router.post("/search/summarize", retrievalController_1.retrievalController.summarize);
// POST /v1/search — full end-to-end search pipeline (Phase 14)
router.post("/search", retrievalController_1.retrievalController.search);
// GET /v1/candidate/:id — read-only full candidate profile (frontend modal)
router.get("/candidate/:id", retrievalController_1.retrievalController.candidate);
exports.default = router;
//# sourceMappingURL=retrievalRoutes.js.map