import { detectSkills, SKILLS } from "../../src/config/skills";

describe("skills detection (Phase 8)", () => {
  it("detects the architecture example skills", () => {
    const text =
      "Experienced in Selenium WebDriver, Python, RAG, DeepEval and MCP (Model Context Protocol).";
    expect(detectSkills(text)).toEqual([
      "Selenium",
      "Python",
      "RAG",
      "DeepEval",
      "MCP (Model Context Protocol)",
    ]);
  });

  it("does not match 'Java' inside 'JavaScript' but matches standalone 'Java'", () => {
    expect(detectSkills("JavaScript only")).toEqual([]);
    expect(detectSkills("Core Java and C#")).toEqual(["Java", "C#"]);
  });

  it("returns [] for empty text", () => {
    expect(detectSkills("")).toEqual([]);
  });

  it("returns canonical names in dictionary order", () => {
    const text = "RAG, Python, Java"; // reverse order in text
    const result = detectSkills(text);
    // dictionary order is Java < Python < RAG
    expect(result).toEqual(["Java", "Python", "RAG"]);
  });

  it("dictionary contains the architecture skill list", () => {
    expect(SKILLS).toContain("MCP (Model Context Protocol)");
    expect(SKILLS).toContain("C#");
  });
});
