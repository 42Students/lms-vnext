import { describe, expect, it } from "vitest";
import {
  learnerPlacementPreparation,
  learnerPlacementRulesQuerySchema,
  placementRulesBackLink,
} from "@/modules/placements/learner-placement-rules-model";

describe("Learner placement rules navigation", () => {
  it("defaults to the dashboard and maps only known caller contexts", () => {
    expect(placementRulesBackLink({})).toEqual({
      href: "/learn/my-placements", label: "Back to My Placements",
    });
    expect(placementRulesBackLink({ from: "cell" }).href).toBe("/learn/my-placements/placement");
    expect(placementRulesBackLink({ from: "drives" }).href).toBe("/learn/my-placements/jobs");
  });
  it("rejects arbitrary URL, identity and array query values", () => {
    expect(learnerPlacementRulesQuerySchema.safeParse({ from: "https://evil.example" }).success).toBe(false);
    expect(learnerPlacementRulesQuerySchema.safeParse({ from: ["cell"] }).success).toBe(false);
    expect(learnerPlacementRulesQuerySchema.safeParse({ membershipId: "another-user" }).success).toBe(false);
    expect(learnerPlacementRulesQuerySchema.safeParse({ from: "../college" }).success).toBe(false);
  });
});

describe("Learner personal placement preparation", () => {
  it("does not treat absent data or defaults as a placement eligibility decision", () => {
    const projection = learnerPlacementPreparation({
      evidence: null,
      preferences: { preferredRoleTitles: [], preferredLocations: [] },
    });
    expect(projection).toMatchObject({
      hasAcademicEvidence: false, academicSource: null, recordedCount: 0, totalCount: 5,
    });
    expect(projection.criteria.every((item) => item.recorded === false)).toBe(true);
    expect(Object.keys(projection)).not.toContain("eligible");
  });
  it("counts recorded zero backlogs and zero gap years as recorded", () => {
    const projection = learnerPlacementPreparation({
      evidence: { cgpa: 8.25, activeBacklogs: 0, gapYears: 0, source: "SELF" },
      preferences: { preferredRoleTitles: ["Engineer"], preferredLocations: [] },
    });
    expect(projection).toMatchObject({
      hasAcademicEvidence: true, academicSource: "SELF", recordedCount: 4, totalCount: 5,
    });
    expect(projection.criteria.find((item) => item.key === "backlogs"))
      .toMatchObject({ recorded: true, detail: "0 active backlogs recorded" });
    expect(projection.criteria.find((item) => item.key === "locations")?.recorded).toBe(false);
  });
  it("does not invent a verified flag from learner-entered evidence", () => {
    const projection = learnerPlacementPreparation({
      evidence: { cgpa: null, activeBacklogs: null, gapYears: null, source: "SELF" },
      preferences: { preferredRoleTitles: [], preferredLocations: ["Hyderabad"] },
    });
    expect(projection.recordedCount).toBe(1);
    expect(projection.academicSource).toBe("SELF");
  });
});
