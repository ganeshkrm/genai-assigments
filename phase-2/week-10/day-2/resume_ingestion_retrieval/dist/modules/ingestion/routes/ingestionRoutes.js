"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ingestionController_1 = require("../controllers/ingestionController");
const multerConfig_1 = require("../../../config/multerConfig");
/**
 * Ingestion module routes. Mounted under "/v1" in app.ts, so the paths
 * below resolve to /v1/resume/... .
 *
 * Phase 3: temporary module readiness route only.
 * Upload/extract/parse/embed/store/inject routes are added in later phases.
 */
const router = (0, express_1.Router)();
// GET /v1/resume/health
router.get("/resume/health", ingestionController_1.ingestionController.resumeHealth);
// POST /v1/resume/upload — secure PDF upload (Phase 4)
router.post("/resume/upload", multerConfig_1.uploadSinglePdf, ingestionController_1.ingestionController.uploadResume);
// POST /v1/resume/extract — PDF text extraction (Phase 5)
router.post("/resume/extract", multerConfig_1.uploadSinglePdf, ingestionController_1.ingestionController.extractResume);
// POST /v1/resume/clean — text cleaning (Phase 6)
router.post("/resume/clean", ingestionController_1.ingestionController.cleanResume);
// POST /v1/resume/skills — skill detection (Phase 8)
router.post("/resume/skills", ingestionController_1.ingestionController.skillsResume);
// POST /v1/resume/parse — algorithm resume parser (Phase 9)
router.post("/resume/parse", ingestionController_1.ingestionController.parseResume);
// POST /v1/resume/llm-parse — optional LLM parser (Phase 10)
router.post("/resume/llm-parse", ingestionController_1.ingestionController.llmParseResume);
// POST /v1/resume/embed — Mistral resume embedding (Phase 11)
router.post("/resume/embed", ingestionController_1.ingestionController.embedResume);
// POST /v1/resume/store — store resume in MongoDB (Phase 12)
router.post("/resume/store", ingestionController_1.ingestionController.storeResume);
// POST /v1/resume/inject — full ingestion pipeline (Phase 13)
router.post("/resume/inject", multerConfig_1.uploadSinglePdf, ingestionController_1.ingestionController.injectResume);
exports.default = router;
//# sourceMappingURL=ingestionRoutes.js.map