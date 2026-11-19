import { ParsedResume } from "../types/ingestion.types";
import { env } from "../../../config/env";

/**
 * Optional LLM-based resume parser (Phase 10), enabled via USE_LLM_PARSER.
 *
 * Uses a Groq chat-completions model (OpenAI-compatible API) to extract a
 * structured resume. The raw LLM output is schema-validated and whitelisted
 * before acceptance, so arbitrary/extra fields are never trusted.
 */

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export class LLMResumeParser {
  async parseResume(rawText: string): Promise<ParsedResume> {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const instruction =
      "You are a precise resume parser. Respond with a single JSON object " +
      "only, no prose. Use these keys exactly: name, email, phone, location, " +
      "company, role, education, totalExperience (number of years), " +
      "relevantExperience (number of years), skills (array of strings), " +
      "jobTitles (array of strings), experienceSummary. Use null for any " +
      "value you cannot determine. Do not invent values.";

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: rawText },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = (await response.json()) as GroqChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty LLM response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("LLM did not return valid JSON");
    }

    return validateParsedResume(parsed);
  }
}

/**
 * Validate and whitelist an untrusted object into a ParsedResume.
 * Unknown fields are dropped; wrong-typed fields are ignored. Throws if the
 * input is not an object at all.
 */
export function validateParsedResume(input: unknown): ParsedResume {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid parsed resume: not an object");
  }
  const obj = input as Record<string, unknown>;

  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
  const num = (v: unknown): number | undefined =>
    typeof v === "number" && !Number.isNaN(v) ? v : undefined;
  const strArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const result: ParsedResume = { skills: strArray(obj.skills) };

  const name = str(obj.name);
  if (name) result.name = name;
  const email = str(obj.email);
  if (email) result.email = email;
  const phone = str(obj.phone);
  if (phone) result.phone = phone;
  const location = str(obj.location);
  if (location) result.location = location;
  const company = str(obj.company);
  if (company) result.company = company;
  const role = str(obj.role);
  if (role) result.role = role;
  const education = str(obj.education);
  if (education) result.education = education;

  const totalExperience = num(obj.totalExperience);
  if (totalExperience !== undefined) result.totalExperience = totalExperience;
  const relevantExperience = num(obj.relevantExperience);
  if (relevantExperience !== undefined) {
    result.relevantExperience = relevantExperience;
  }

  const jobTitles = strArray(obj.jobTitles);
  if (jobTitles.length > 0) result.jobTitles = jobTitles;
  const experienceSummary = str(obj.experienceSummary);
  if (experienceSummary) result.experienceSummary = experienceSummary;

  return result;
}
