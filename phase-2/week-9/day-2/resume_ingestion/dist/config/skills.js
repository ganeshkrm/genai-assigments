"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILLS = void 0;
exports.detectSkills = detectSkills;
/**
 * Skills dictionary + deterministic detection (Phase 8).
 *
 * Detection is case-insensitive and boundary-aware: a skill matches only when
 * it is not surrounded by other alphanumeric characters, so "Java" is not
 * detected inside "JavaScript", while symbols like "C#", ".NET" and
 * "MCP (Model Context Protocol)" are matched literally.
 */
exports.SKILLS = [
    "Java",
    "Selenium",
    "Playwright",
    "API Testing",
    "Postman",
    "SQL",
    "MongoDB",
    "Jenkins",
    "Python",
    "C#",
    "REST Assured",
    "Cucumber",
    "GenAI",
    "Langchain",
    "Langgraph",
    "RAG",
    "Azure DevOps",
    "AWS Lambda",
    "GitHub",
    "DeepEval",
    "MCP (Model Context Protocol)",
];
/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Build a boundary-aware, case-insensitive matcher for a single skill.
 * Boundaries are "not an alphanumeric character" so neighbouring punctuation
 * and whitespace are allowed but adjacent letters/digits are not.
 */
function buildSkillRegex(skill) {
    return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(skill)}(?![A-Za-z0-9])`, "i");
}
/**
 * Detect skills present in the given text, returning the canonical dictionary
 * names in dictionary order (deterministic).
 */
function detectSkills(text) {
    if (!text) {
        return [];
    }
    return exports.SKILLS.filter((skill) => buildSkillRegex(skill).test(text));
}
//# sourceMappingURL=skills.js.map