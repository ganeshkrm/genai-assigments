import { cleanText } from "../../src/modules/ingestion/utils/textCleaner";

describe("textCleaner (Phase 6)", () => {
  it("matches the architecture example (collapses blank lines + trims)", () => {
    const input =
      "Rajesh Mohan Kumar\n\n\nTest Architect & Senior Agentic Test Engineer   \n RAG";
    expect(cleanText(input)).toBe(
      "Rajesh Mohan Kumar\nTest Architect & Senior Agentic Test Engineer\nRAG"
    );
  });

  it("preserves technical symbols C#, C++, .NET and collapses spaces", () => {
    expect(cleanText("Skills:   C#  C++   .NET\t\tPython")).toBe(
      "Skills: C# C++ .NET Python"
    );
  });

  it("keeps hyphens, dates and emails intact", () => {
    expect(cleanText("web-based  B.Tech - IT  a@b.com  13+ years")).toBe(
      "web-based B.Tech - IT a@b.com 13+ years"
    );
  });

  it("strips control characters and the replacement character", () => {
    const input = "Line A" + String.fromCharCode(0x07, 0xfffd) + "\nvalue";
    expect(cleanText(input)).toBe("Line A\nvalue");
  });

  it("strips private-use bullet glyphs", () => {
    const input = "intro\n" + String.fromCharCode(0xf0b7) + " bullet item";
    expect(cleanText(input)).toBe("intro\nbullet item");
  });

  it("returns empty string for empty input", () => {
    expect(cleanText("")).toBe("");
  });
});
