/**
 * Text cleaning utilities (Phase 6).
 *
 * Normalizes extracted resume text before parsing or embedding:
 * - Normalizes line breaks (CRLF / CR -> LF).
 * - Removes unwanted control characters and PDF bullet artifacts.
 * - Collapses repeated whitespace within a line.
 * - Removes duplicate/blank lines.
 *
 * Preserves meaningful content: technical symbols (C#, C++, .NET),
 * dates, job titles, emails and technical terms are left intact.
 */

// Characters to strip entirely:
//  - U+0000-U+001F C0 control chars, except TAB (U+0009) and LF (U+000A)
//  - U+007F-U+009F DEL and C1 control chars
//  - U+FFFD Unicode replacement character
//  - U+E000-U+F8FF private-use area (PDF bullet glyphs that render as boxes)
const UNWANTED_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD\uE000-\uF8FF]/g;

export function cleanText(rawText: string): string {
  if (!rawText) {
    return "";
  }

  // 1. Normalize line breaks.
  let text = rawText.replace(/\r\n?/g, "\n");

  // 2. Remove unwanted control characters and PDF bullet artifacts.
  text = text.replace(UNWANTED_CHARS, "");

  // 3. Per-line: collapse repeated whitespace (not newlines) and trim ends.
  const lines = text
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim());

  // 4. Drop blank lines (removes duplicate blank lines / extra breaks).
  const nonEmpty = lines.filter((line) => line.length > 0);

  return nonEmpty.join("\n");
}
