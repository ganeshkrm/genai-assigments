import {
  EMAIL_REGEX,
  PHONE_REGEX,
  EXPERIENCE_REGEX,
  extractEmail,
  extractPhone,
  extractExperienceYears,
} from "../../src/modules/ingestion/utils/regex";

describe("regex utilities (Phase 7)", () => {
  describe("EXPERIENCE_REGEX / extractExperienceYears", () => {
    it("extracts 13 from the documented example '13+ years of experience'", () => {
      expect(extractExperienceYears("13+ years of experience")).toBe(13);
    });

    it("extracts a plain '13 years'", () => {
      expect(extractExperienceYears("13 years")).toBe(13);
    });

    it("extracts a decimal '13.5 yrs'", () => {
      expect(extractExperienceYears("13.5 yrs")).toBe(13.5);
    });

    it("extracts 14 from '14 plus years'", () => {
      expect(extractExperienceYears("14 plus years of experience")).toBe(14);
    });

    it("returns undefined when no experience phrase is present", () => {
      expect(extractExperienceYears("no duration here")).toBeUndefined();
    });

    it("EXPERIENCE_REGEX matches the documented example", () => {
      expect(EXPERIENCE_REGEX.test("13+ years")).toBe(true);
    });
  });

  describe("EMAIL_REGEX / extractEmail", () => {
    it("extracts a standard email", () => {
      expect(extractEmail("Contact: ganesh.kumar@example.com here")).toBe(
        "ganesh.kumar@example.com"
      );
    });

    it("returns undefined when there is no email", () => {
      expect(extractEmail("no email present")).toBeUndefined();
    });
  });

  describe("PHONE_REGEX / extractPhone", () => {
    it("extracts a +91-prefixed Indian mobile number", () => {
      expect(extractPhone("Phone: +91 9876543210")).toBe("+91 9876543210");
    });

    it("extracts a bare 10-digit Indian mobile number", () => {
      expect(extractPhone("reach me at 9876543210")).toBe("9876543210");
    });

    it("returns undefined when there is no phone number", () => {
      expect(extractPhone("no phone here")).toBeUndefined();
    });
  });
});
