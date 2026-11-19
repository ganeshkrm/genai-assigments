"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParserService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const pdf_parse_1 = require("pdf-parse");
/**
 * Converts an uploaded PDF into raw text (Phase 5).
 *
 * Flow:  PDF file  →  pdf-parse (PDFParse)  →  rawText
 */
class ResumeParserService {
    async extractTextFromPdf(filePath) {
        const dataBuffer = await promises_1.default.readFile(filePath);
        const parser = new pdf_parse_1.PDFParse({ data: dataBuffer });
        try {
            const result = await parser.getText();
            // Use per-page text and join. The concatenated `result.text` injects
            // page markers like "-- 1 of 1 --"; the per-page `pages[].text` does
            // not, so an image-only / no-text PDF yields an empty string here and
            // is correctly treated as an extraction failure by the caller.
            const rawText = (result.pages ?? [])
                .map((p) => p.text ?? "")
                .join("\n")
                .trim();
            return rawText;
        }
        finally {
            await parser.destroy();
        }
    }
}
exports.ResumeParserService = ResumeParserService;
//# sourceMappingURL=ResumeParserService.js.map