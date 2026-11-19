import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

/**
 * Converts an uploaded PDF into raw text (Phase 5).
 *
 * Flow:  PDF file  →  pdf-parse (PDFParse)  →  rawText
 */
export class ResumeParserService {
  async extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);

    const parser = new PDFParse({ data: dataBuffer });
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
    } finally {
      await parser.destroy();
    }
  }
}
