import { ParsedResume } from "../types/ingestion.types";
import { cleanText } from "../utils/textCleaner";
import {
  extractEmail,
  extractPhone,
  extractExperienceYears,
} from "../utils/regex";
import { detectSkills } from "../../../config/skills";

/**
 * Deterministic resume parser (Phase 9) — converts resume text into structured
 * JSON without requiring an LLM.
 *
 * Design principle: return only fields that can be supported from the text.
 * Values that cannot be derived are omitted rather than invented.
 */

// Matches an education/degree mention anywhere in a line.
const EDUCATION_REGEX =
  /\b(B\.?\s?Tech|B\.?\s?E|M\.?\s?Tech|M\.?\s?E|B\.?\s?Sc|M\.?\s?Sc|MBA|MCA|BCA|B\.?\s?Com|Ph\.?\s?D|Bachelor|Master|Diploma)\b/i;

// Matches a company-name line by common organization suffixes/keywords.
const COMPANY_REGEX =
  /\b(Pvt\.?|Private\s+Limited|Ltd\.?|Limited|Inc\.?|LLC|Technologies|Solutions|Systems|Software|Consultancy|Consulting|Services)\b/i;

export class AlgorithmResumeParser {
  parseResume(rawText: string): ParsedResume {
    const clean = cleanText(rawText);
    const lines = clean
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const skills = detectSkills(clean);

    // Deterministic field extraction.
    const name = lines[0];
    const role = lines[1];
    const email = extractEmail(clean);
    const phone = extractPhone(clean);
    const totalExperience = extractExperienceYears(clean);
    const education = this.findFirstMatchingLine(lines, EDUCATION_REGEX);
    const company = this.findFirstMatchingLine(lines, COMPANY_REGEX);

    // Build the result with only the fields we can support.
    const resume: ParsedResume = { skills };

    if (name) resume.name = name;
    if (role) resume.role = role;
    if (email) resume.email = email;
    if (phone) resume.phone = phone;
    if (company) resume.company = company;
    if (education) resume.education = education;
    if (totalExperience !== undefined) {
      resume.totalExperience = totalExperience;
    }

    return resume;
  }

  private findFirstMatchingLine(
    lines: string[],
    regex: RegExp
  ): string | undefined {
    return lines.find((line) => regex.test(line));
  }
}
