"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openapiSpec = void 0;
const env_1 = require("./env");
/**
 * Hand-authored OpenAPI 3.0 spec for the Resume RAG backend (ingestion +
 * retrieval). Served via swagger-ui-express at /docs. Examples pre-fill the
 * "Try it out" forms so every endpoint is testable from the browser.
 */
const errorResponse = {
    type: "object",
    properties: {
        success: { type: "boolean", example: false },
        requestId: { type: "string" },
        errorCode: { type: "string" },
        message: { type: "string" },
    },
};
const jsonBody = (example) => ({
    required: true,
    content: { "application/json": { schema: { type: "object" }, example } },
});
const fileUploadBody = {
    required: true,
    content: {
        "multipart/form-data": {
            schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
                required: ["file"],
            },
        },
    },
};
const ok = (example) => ({
    description: "Success",
    content: { "application/json": { example } },
});
const errResp = (description) => ({
    description,
    content: { "application/json": { schema: errorResponse } },
});
exports.openapiSpec = {
    openapi: "3.0.3",
    info: {
        title: `${env_1.APP_NAME} API`,
        version: env_1.APP_VERSION,
        description: "Resume RAG backend — ingestion (upload → extract → clean → parse → embed → store) and retrieval (BM25 + vector + hybrid + LLM re-rank + summarize). One Express server, one MongoDB.",
    },
    servers: [{ url: "http://localhost:3000", description: "Local dev" }],
    tags: [
        { name: "Health", description: "Liveness & readiness" },
        { name: "Ingestion", description: "Resume ingestion pipeline" },
        { name: "Retrieval", description: "Search & ranking" },
    ],
    paths: {
        "/v1/health": {
            get: {
                tags: ["Health"],
                summary: "Service health",
                responses: {
                    "200": ok({
                        status: "ok",
                        app: env_1.APP_NAME,
                        version: env_1.APP_VERSION,
                        uptime: 12.4,
                    }),
                },
            },
        },
        "/v1/health/db": {
            get: {
                tags: ["Health"],
                summary: "Database connectivity",
                responses: {
                    "200": ok({
                        status: "ok",
                        database: "mongodb",
                        connected: true,
                        latencyMs: 18,
                    }),
                    "503": errResp("Database unavailable"),
                },
            },
        },
        "/v1/resume/health": {
            get: {
                tags: ["Ingestion"],
                summary: "Ingestion module readiness",
                responses: { "200": ok({ status: "ok", module: "resume-ingestion" }) },
            },
        },
        "/v1/resume/upload": {
            post: {
                tags: ["Ingestion"],
                summary: "Upload a resume PDF (validation only)",
                requestBody: fileUploadBody,
                responses: {
                    "200": ok({
                        success: true,
                        message: "Resume uploaded successfully",
                        file: {
                            originalName: "resume.pdf",
                            mimeType: "application/pdf",
                            size: 123456,
                        },
                    }),
                    "400": errResp("FILE_REQUIRED"),
                    "413": errResp("FILE_TOO_LARGE"),
                    "415": errResp("INVALID_FILE_TYPE"),
                },
            },
        },
        "/v1/resume/extract": {
            post: {
                tags: ["Ingestion"],
                summary: "Extract raw text from a PDF",
                requestBody: fileUploadBody,
                responses: {
                    "200": ok({ success: true, rawText: "Ganesh Kumar Mohan ...", characters: 8421 }),
                    "415": errResp("INVALID_FILE_TYPE"),
                    "422": errResp("RESUME_EXTRACTION_FAILED"),
                },
            },
        },
        "/v1/resume/clean": {
            post: {
                tags: ["Ingestion"],
                summary: "Normalize extracted text",
                requestBody: jsonBody({
                    rawText: "Ganesh Kumar Mohan\n\n\nQuality Automation Specialist   \n RAG",
                }),
                responses: {
                    "200": ok({
                        success: true,
                        cleanText: "Ganesh Kumar Mohan\nQuality Automation Specialist\nRAG",
                    }),
                    "400": errResp("VALIDATION_ERROR"),
                },
            },
        },
        "/v1/resume/skills": {
            post: {
                tags: ["Ingestion"],
                summary: "Detect skills (dictionary)",
                requestBody: jsonBody({
                    rawText: "Experienced in Selenium WebDriver, Python, RAG, DeepEval and MCP (Model Context Protocol).",
                }),
                responses: {
                    "200": ok({
                        success: true,
                        skills: ["Selenium", "Python", "RAG", "DeepEval", "MCP (Model Context Protocol)"],
                    }),
                },
            },
        },
        "/v1/resume/parse": {
            post: {
                tags: ["Ingestion"],
                summary: "Algorithm resume parser (deterministic)",
                requestBody: jsonBody({
                    rawText: "Ganesh Kumar Mohan\nQuality Automation Specialist, AVP\nEnterprise Software Services Pvt Ltd\nB.E Electronics & Communication Engineering\n14 plus years of experience\nSkills: Selenium, Core Java, C#, Python, RAG, DeepEval, MCP (Model Context Protocol)",
                }),
                responses: {
                    "200": ok({ success: true, resume: { name: "Ganesh Kumar Mohan", role: "Quality Automation Specialist, AVP", totalExperience: 14, skills: ["Selenium", "Java", "C#", "Python", "RAG", "DeepEval", "MCP (Model Context Protocol)"] } }),
                    "422": errResp("RESUME_PARSE_FAILED"),
                },
            },
        },
        "/v1/resume/llm-parse": {
            post: {
                tags: ["Ingestion"],
                summary: "Optional LLM parser (gated by USE_LLM_PARSER)",
                requestBody: jsonBody({ rawText: "Ganesh Kumar Mohan\nQuality Automation Specialist" }),
                responses: {
                    "200": ok({ success: true, parser: "llm", resume: {} }),
                    "403": errResp("LLM_PARSER_DISABLED"),
                },
            },
        },
        "/v1/resume/embed": {
            post: {
                tags: ["Ingestion"],
                summary: "Generate a Mistral embedding for resume fields",
                requestBody: jsonBody({
                    name: "Ganesh Kumar Mohan",
                    role: "Quality Automation Specialist",
                    skills: ["RAG", "DeepEval", "MCP (Model Context Protocol)"],
                    company: "Example Corp",
                    rawText: "14 plus years in quality automation, Cypress, Selenium, Python, RAG, DeepEval.",
                }),
                responses: {
                    "200": ok({ success: true, model: "mistral-embed", dimension: 1024, embedding: [0.0123, -0.0311, 0.0048] }),
                    "502": errResp("EMBEDDING_FAILED"),
                },
            },
        },
        "/v1/resume/store": {
            post: {
                tags: ["Ingestion"],
                summary: "Store a resume document in MongoDB",
                requestBody: jsonBody({
                    fileName: "GaneshKumar.pdf",
                    resume: { name: "Ganesh Kumar Mohan", role: "Quality Automation Specialist", skills: ["RAG", "DeepEval"] },
                    rawText: "cleaned resume text",
                    embedding: [0.01, -0.03, 0.004],
                }),
                responses: {
                    "200": ok({ success: true, message: "Resume stored successfully", resumeId: "6ae74b63aa6b100a1f127401" }),
                    "400": errResp("VALIDATION_ERROR"),
                    "500": errResp("INGESTION_FAILED"),
                },
            },
        },
        "/v1/resume/inject": {
            post: {
                tags: ["Ingestion"],
                summary: "Full ingestion pipeline (PDF → stored record)",
                requestBody: fileUploadBody,
                responses: {
                    "200": ok({ success: true, message: "Resume ingestion completed", resumeId: "6ae74b63aa6b100a1f127401", data: { name: "Ganesh Kumar Mohan", role: "Quality Automation Specialist, AVP", totalExperience: 14, skillsCount: 7, embeddingModel: "mistral-embed", embeddingDimension: 1024 }, timings: { extractMs: 175, cleanMs: 0, parseMs: 4, embeddingMs: 516, mongoInsertMs: 71, totalMs: 767 } }),
                    "415": errResp("INVALID_FILE_TYPE"),
                    "422": errResp("RESUME_EXTRACTION_FAILED / RESUME_PARSE_FAILED"),
                    "502": errResp("EMBEDDING_FAILED"),
                    "500": errResp("INGESTION_FAILED"),
                },
            },
        },
        "/v1/embeddings": {
            post: {
                tags: ["Retrieval"],
                summary: "On-demand query embedding",
                requestBody: jsonBody({
                    model: "mistral-embed",
                    input: "senior agentic QA architect with RAG, DeepEval and MCP experience",
                }),
                responses: {
                    "200": ok({ embedding: [0.012, -0.044, 0.008], model: "mistral-embed", dimension: 1024 }),
                    "400": errResp("VALIDATION_ERROR"),
                    "502": errResp("EMBEDDING_FAILED"),
                },
            },
        },
        "/v1/search/readiness": {
            get: {
                tags: ["Retrieval"],
                summary: "Retrieval readiness check",
                responses: {
                    "200": ok({ ready: true, collection: "resumes", resumeCount: 186, resumesWithEmbedding: 186, embeddingModel: "mistral-embed", embeddingDimension: 1024 }),
                    "503": errResp("Not ready"),
                },
            },
        },
        "/v1/search/bm25": {
            post: {
                tags: ["Retrieval"],
                summary: "Lexical BM25 search",
                requestBody: jsonBody({
                    query: "agentic QA architect RAG MCP DeepEval Selenium",
                    topK: 20,
                    filters: { minYearsExperience: 10 },
                }),
                responses: {
                    "200": ok({ mode: "bm25", query: "agentic QA architect RAG MCP DeepEval Selenium", count: 1, results: [{ resumeId: "6af84074e54753d81a350faa", name: "Ganesh Kumar Mohan", role: "Quality Automation Specialist, AVP", score: 3.25, matchedSkills: ["Selenium", "RAG", "DeepEval", "MCP (Model Context Protocol)"] }] }),
                    "400": errResp("INVALID_SEARCH_QUERY"),
                },
            },
        },
        "/v1/search/vector": {
            post: {
                tags: ["Retrieval"],
                summary: "Semantic vector search",
                requestBody: jsonBody({
                    query: "senior engineer who has built safe RAG and LLM evaluation systems",
                    topK: 20,
                }),
                responses: {
                    "200": ok({ mode: "vector", query: "...", count: 1, results: [{ resumeId: "6af84074e54753d81a350faa", name: "Ganesh Kumar Mohan", role: "Quality Automation Specialist, AVP", vectorScore: 0.83 }] }),
                    "400": errResp("INVALID_SEARCH_QUERY"),
                    "502": errResp("EMBEDDING_FAILED / VECTOR_SEARCH_FAILED"),
                },
            },
        },
        "/v1/search/hybrid": {
            post: {
                tags: ["Retrieval"],
                summary: "Parallel BM25 + vector (separate scores)",
                requestBody: jsonBody({
                    query: "agentic QA architect with RAG evaluation",
                    topK: 20,
                    filters: { minYearsExperience: 10 },
                }),
                responses: {
                    "200": ok({ mode: "hybrid-debug", bm25: [{ resumeId: "...", name: "Ganesh Kumar Mohan", score: 0.55 }], vector: [{ resumeId: "...", name: "Ganesh Kumar Mohan", score: 0.85 }], timings: { bm25Ms: 121, embeddingMs: 150, vectorMs: 53 } }),
                    "400": errResp("INVALID_SEARCH_QUERY"),
                },
            },
        },
        "/v1/search/rerank": {
            post: {
                tags: ["Retrieval"],
                summary: "LLM re-rank of supplied candidates",
                requestBody: jsonBody({
                    query: "Need a senior QA architect experienced in RAG, DeepEval, MCP",
                    candidates: [
                        { resumeId: "6af84074e54753d81a350faa", snippet: "Quality Automation Specialist AVP, 14+ years, RAG DeepEval MCP, LLM evaluation" },
                        { resumeId: "cand-junior-001", snippet: "Fresher QA, 0 years, manual testing basics" },
                    ],
                    topK: 10,
                }),
                responses: {
                    "200": ok({ results: [{ resumeId: "6af84074e54753d81a350faa", rank: 1, relevanceScore: 0.96, reason: "..." }], model: "openai/gpt-oss-120b" }),
                    "400": errResp("INVALID_SEARCH_QUERY / VALIDATION_ERROR"),
                    "502": errResp("LLM_RERANK_FAILED"),
                },
            },
        },
        "/v1/search/summarize": {
            post: {
                tags: ["Retrieval"],
                summary: "Candidate-fit summary",
                requestBody: jsonBody({
                    query: "Senior QA architect with GenAI RAG and evaluation experience",
                    candidate: { resumeId: "6af84074e54753d81a350faa", snippet: "14+ years, RAG, DeepEval, MCP, Agentic QA" },
                    style: "short",
                    maxTokens: 150,
                }),
                responses: {
                    "200": ok({ resumeId: "6af84074e54753d81a350faa", summary: "Strong fit for a senior QA/GenAI architecture role ..." }),
                    "400": errResp("VALIDATION_ERROR"),
                    "502": errResp("SUMMARIZATION_FAILED"),
                },
            },
        },
        "/v1/search": {
            post: {
                tags: ["Retrieval"],
                summary: "Full end-to-end search (embed + BM25 + vector + re-rank + summarize)",
                requestBody: jsonBody({
                    query: "Senior agentic QA architect with RAG, MCP, DeepEval and API automation experience",
                    filters: { minYearsExperience: 10 },
                    options: { bm25TopK: 20, vectorTopK: 20, rerankTopN: 10, finalTopK: 5, summarize: true, summaryStyle: "short" },
                }),
                responses: {
                    "200": ok({ query: "...", results: [{ rank: 1, resumeId: "6af84074e54753d81a350faa", name: "Ganesh Kumar Mohan", role: "Quality Automation Specialist, AVP", company: null, totalExperience: 14, skills: ["RAG", "DeepEval", "MCP (Model Context Protocol)"], sources: ["bm25", "vector"], relevanceScore: 0.85, summary: "..." }], degraded: false, warnings: [], timings: { embeddingMs: 150, bm25Ms: 85, vectorMs: 75, rerankMs: 420, summarizeMs: 210, totalMs: 940 } }),
                    "400": errResp("INVALID_SEARCH_QUERY"),
                    "413": errResp("PAYLOAD_TOO_LARGE"),
                    "503": errResp("SEARCH_UNAVAILABLE"),
                },
            },
        },
    },
};
//# sourceMappingURL=openapi.js.map