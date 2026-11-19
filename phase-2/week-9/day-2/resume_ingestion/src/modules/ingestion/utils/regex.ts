/**
 * Reusable deterministic extraction helpers (Phase 7).
 *
 * These regexes are consumed by the Algorithm Resume Parser (Phase 9).
 * There is no endpoint for this module; it is verified via unit tests.
 */

/** Matches an email address. */
export const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

/** Matches an Indian mobile number (optionally +91 / 91 prefixed). */
export const PHONE_REGEX = /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/;

/**
 * Matches an experience duration such as "13 years", "13.5 yrs" or "13+ years".
 *
 * NOTE: The architecture's example regex `/(\d+(\.\d+)?)\s*(years|yrs)/i`
 * does not actually match its own documented example "13+ years" — the "+"
 * sits between the number and the whitespace, so `\s*` fails. This version
 * allows an optional "+" (or the word "plus") between the number and the unit
 * so both the documented verification ("13+ years of experience" -> 13) and
 * real-world phrasing ("14 plus years") are handled. Capture group 1 is the
 * numeric value.
 */
export const EXPERIENCE_REGEX =
  /(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years|yrs)/i;

/** Extract the first email address found, or undefined. */
export function extractEmail(text: string): string | undefined {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : undefined;
}

/** Extract the first phone number found, or undefined. */
export function extractPhone(text: string): string | undefined {
  const match = text.match(PHONE_REGEX);
  return match ? match[0] : undefined;
}

/** Extract the first experience value (in years) as a number, or undefined. */
export function extractExperienceYears(text: string): number | undefined {
  const match = text.match(EXPERIENCE_REGEX);
  return match ? parseFloat(match[1]) : undefined;
}
