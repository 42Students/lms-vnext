import { describe, expect, it } from "vitest";
import { candidatePreferencesInputSchema } from "@/modules/placements/validation";

describe("candidate placement preferences validation", () => {
  it("normalizes duplicates without inventing preferences", () => {
    expect(
      candidatePreferencesInputSchema.parse({
        preferredRoleTitles: [
          " Software Engineer ",
          "software engineer",
          "Data Engineer",
        ],
        preferredLocations: [
          "Hyderabad",
          " hyderabad ",
        ],
        preferredEmploymentTypes: [
          "FULL_TIME",
          "FULL_TIME",
          "INTERNSHIP",
        ],
      }),
    ).toMatchObject({
      preferredRoleTitles: [
        "Software Engineer",
        "Data Engineer",
      ],
      preferredLocations: ["Hyderabad"],
      preferredEmploymentTypes: [
        "FULL_TIME",
        "INTERNSHIP",
      ],
      preferredWorkMode: "NO_PREFERENCE",
      shiftPreference: "NO_PREFERENCE",
      minimumAnnualCtcInr: null,
      relocationPreference: "NO_PREFERENCE",
      notifyMatchingJobs: true,
      notifyApplicationUpdates: true,
    });
  });

  it("rejects invalid ranges and unknown enum values", () => {
    expect(() =>
      candidatePreferencesInputSchema.parse({
        minimumAnnualCtcInr: -1,
      }),
    ).toThrow();

    expect(() =>
      candidatePreferencesInputSchema.parse({
        preferredWorkMode: "ANYWHERE",
      }),
    ).toThrow();
  });
});
