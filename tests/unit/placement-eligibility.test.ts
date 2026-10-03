import { describe, expect, it } from "vitest";
import {
  candidateAcademicEvidenceInputSchema,
  placementEligibilityPolicyInputSchema,
} from "@/modules/placements/validation";

describe("Placement eligibility validation", () => {
  it("accepts precise academic evidence and rejects impossible values", () => {
    expect(
      candidateAcademicEvidenceInputSchema.parse({
        cgpa: 8.75,
        tenthPercentage: 92.4,
        activeBacklogs: 0,
        passingYear: 2027,
      }),
    ).toMatchObject({
      cgpa: 8.75,
      tenthPercentage: 92.4,
      activeBacklogs: 0,
      passingYear: 2027,
    });

    expect(() =>
      candidateAcademicEvidenceInputSchema.parse({
        cgpa: 10.5,
      }),
    ).toThrow();
  });

  it("deduplicates structural eligibility scope and defaults missing evidence safely", () => {
    const programId =
      "71000000-0000-4000-8000-000000000001";
    expect(
      placementEligibilityPolicyInputSchema.parse({
        allowedProgramIds: [programId, programId],
        minCgpa: 7.5,
      }),
    ).toMatchObject({
      allowedProgramIds: [programId],
      minCgpa: 7.5,
      missingEvidencePolicy: "ALLOW_WITH_FLAG",
    });
  });
});
