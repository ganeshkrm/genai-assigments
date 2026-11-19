"use strict";
/**
 * Reusable deterministic extraction helpers (Phase 7).
 *
 * These regexes are consumed by the Algorithm Resume Parser (Phase 9).
 * There is no endpoint for this module; it is verified via unit tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPERIENCE_REGEX = exports.PHONE_REGEX = exports.EMAIL_REGEX = void 0;
exports.extractEmail = extractEmail;
exports.extractPhone = extractPhone;
exports.extractExperienceYears = extractExperienceYears;
/** Matches an email address. */
exports.EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
/** Matches an Indian mobile number (optionally +91 / 91 prefixed). */
exports.PHONE_REGEX = /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/;
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
exports.EXPERIENCE_REGEX = /(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years|yrs)/i;
/** Extract the first email address found, or undefined. */
function extractEmail(text) {
    const match = text.match(exports.EMAIL_REGEX);
    return match ? match[0] : undefined;
}
/** Extract the first phone number found, or undefined. */
function extractPhone(text) {
    const match = text.match(exports.PHONE_REGEX);
    return match ? match[0] : undefined;
}
/** Extract the first experience value (in years) as a number, or undefined. */
function extractExperienceYears(text) {
    const match = text.match(exports.EXPERIENCE_REGEX);
    return match ? parseFloat(match[1]) : undefined;
}
//# sourceMappingURL=regex.js.map