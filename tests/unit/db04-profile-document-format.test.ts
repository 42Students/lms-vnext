import { describe, expect, it } from "vitest";
import { learnerProfileDocumentSchema } from "@/modules/people/profile-validation";

const id = "cec83342-dda2-4e5c-a189-19a82f7dbff7";
describe("DB04 learner profile formatting regressions", () => {
  it("accepts valid alternate telephone digits and rejects alphabetic impostors", () => {
    expect(learnerProfileDocumentSchema.parse({
      contacts: {alternatePhone: "919876543210"},
    }).contacts.alternatePhone).toBe("919876543210");
    // Historical contact imports use a leading country code and separators;
    // accept the valid number without accepting alphabetic impersonators.
    expect(learnerProfileDocumentSchema.parse({
      contacts: {alternatePhone: "+91 98765-43210"},
    }).contacts.alternatePhone).toBe("+91 98765-43210");
    expect(() => learnerProfileDocumentSchema.parse({
      contacts: {alternatePhone: "+91 +98765-43210"},
    })).toThrow();
    expect(() => learnerProfileDocumentSchema.parse({
      contacts: {alternatePhone: "dddddddddddd"},
    })).toThrow();
  });

  it("accepts real four-digit education start/end years", () => {
    const document = learnerProfileDocumentSchema.parse({
      education: [{
        id, educationType: "UG", startYear: "2022", endYear: "2026",
      }],
    });
    expect(document.education[0].startYear).toBe("2022");
    expect(document.education[0].endYear).toBe("2026");
    expect(() => learnerProfileDocumentSchema.parse({
      education: [{id, educationType: "UG", startYear: "dddd"}],
    })).toThrow();
  });

  it("keeps four-digit years valid on achievements and extracurriculars", () => {
    const document = learnerProfileDocumentSchema.parse({
      achievements: [{id, title: "Scholarship", year: "2025"}],
      extracurriculars: [{id, activity: "Volunteer", year: "2024"}],
    });
    expect(document.achievements[0].year).toBe("2025");
    expect(document.extracurriculars[0].year).toBe("2024");
    expect(() => learnerProfileDocumentSchema.parse({
      achievements: [{id, title: "Scholarship", year: "d024"}],
    })).toThrow();
  });
});
