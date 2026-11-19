import { AlgorithmResumeParser } from "../../src/modules/ingestion/services/AlgorithmResumeParser";

describe("AlgorithmResumeParser (Phase 9)", () => {
  const parser = new AlgorithmResumeParser();

  const sample = [
    "Rajesh Mohan Kumar",
    "Test Architect & Senior Agentic Test Engineer",
    "Testleaf Software Solutions Private Limited",
    "B.Tech - Information Technology",
    "13+ years of experience",
    "Skills: Selenium WebDriver, Core Java, C#, Python, REST Assured, Postman, RAG, DeepEval, MCP (Model Context Protocol)",
  ].join("\n");

  it("extracts name, role, company, education and total experience", () => {
    const r = parser.parseResume(sample);
    expect(r.name).toBe("Rajesh Mohan Kumar");
    expect(r.role).toBe("Test Architect & Senior Agentic Test Engineer");
    expect(r.company).toBe("Testleaf Software Solutions Private Limited");
    expect(r.education).toBe("B.Tech - Information Technology");
    expect(r.totalExperience).toBe(13);
  });

  it("detects multiple known skills", () => {
    const r = parser.parseResume(sample);
    expect(r.skills).toEqual(
      expect.arrayContaining([
        "Selenium",
        "Java",
        "C#",
        "Python",
        "RAG",
        "DeepEval",
        "MCP (Model Context Protocol)",
      ])
    );
  });

  it("omits fields that cannot be derived (no hallucination)", () => {
    const r = parser.parseResume("Ganesh Kumar Mohan\nQuality Automation Specialist\nPython");
    expect(r.name).toBe("Ganesh Kumar Mohan");
    expect(r.role).toBe("Quality Automation Specialist");
    expect(r.company).toBeUndefined();
    expect(r.email).toBeUndefined();
    expect(r.totalExperience).toBeUndefined();
    expect(r.skills).toEqual(["Python"]);
  });

  it("extracts email and phone when present", () => {
    const r = parser.parseResume(
      "Ganesh Kumar Mohan\nQA\nEmail: ganesh@example.com Phone: +91 9876543210"
    );
    expect(r.email).toBe("ganesh@example.com");
    expect(r.phone).toBe("+91 9876543210");
  });
});
