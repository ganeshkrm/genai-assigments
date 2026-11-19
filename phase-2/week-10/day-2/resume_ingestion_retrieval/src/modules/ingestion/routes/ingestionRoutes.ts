import { Router } from "express";
import { ingestionController } from "../controllers/ingestionController";
import { uploadSinglePdf } from "../../../config/multerConfig";

/**
 * Ingestion module routes. Mounted under "/v1" in app.ts, so the paths
 * below resolve to /v1/resume/... .
 *
 * Phase 3: temporary module readiness route only.
 * Upload/extract/parse/embed/store/inject routes are added in later phases.
 */
const router = Router();

// GET /v1/resume/health
router.get("/resume/health", ingestionController.resumeHealth);

// POST /v1/resume/upload — secure PDF upload (Phase 4)
router.post("/resume/upload", uploadSinglePdf, ingestionController.uploadResume);

// POST /v1/resume/extract — PDF text extraction (Phase 5)
router.post("/resume/extract", uploadSinglePdf, ingestionController.extractResume);

// POST /v1/resume/clean — text cleaning (Phase 6)
router.post("/resume/clean", ingestionController.cleanResume);

// POST /v1/resume/skills — skill detection (Phase 8)
router.post("/resume/skills", ingestionController.skillsResume);

// POST /v1/resume/parse — algorithm resume parser (Phase 9)
router.post("/resume/parse", ingestionController.parseResume);

// POST /v1/resume/llm-parse — optional LLM parser (Phase 10)
router.post("/resume/llm-parse", ingestionController.llmParseResume);

// POST /v1/resume/embed — Mistral resume embedding (Phase 11)
router.post("/resume/embed", ingestionController.embedResume);

// POST /v1/resume/store — store resume in MongoDB (Phase 12)
router.post("/resume/store", ingestionController.storeResume);

// POST /v1/resume/inject — full ingestion pipeline (Phase 13)
router.post("/resume/inject", uploadSinglePdf, ingestionController.injectResume);

export default router;
