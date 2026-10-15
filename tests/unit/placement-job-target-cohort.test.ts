import { describe, expect, it } from "vitest";
import { isPlacementJobTargetCohort } from "@/modules/placements/eligibility-service";

const own = {
  programId: "program-1",
  cohortId: "cohort-1",
};

describe("P-S1-03 learner job audience boundary", () => {
  it("permits unrestricted jobs with no explicit audience", () => {
    expect(isPlacementJobTargetCohort(null, own)).toBe(true);
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: [],
      allowedCohortIds: [],
    }, own)).toBe(true);
  });

  it("requires matching program when a program audience exists", () => {
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: ["program-1"],
      allowedCohortIds: [],
    }, own)).toBe(true);
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: ["program-2"],
      allowedCohortIds: [],
    }, own)).toBe(false);
  });

  it("requires matching cohort when a cohort audience exists", () => {
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: [],
      allowedCohortIds: ["cohort-1"],
    }, own)).toBe(true);
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: [],
      allowedCohortIds: ["cohort-2"],
    }, own)).toBe(false);
  });

  it("requires both audience dimensions to match", () => {
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: ["program-1", "program-3"],
      allowedCohortIds: ["cohort-1", "cohort-3"],
    }, own)).toBe(true);
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: ["program-1"],
      allowedCohortIds: ["cohort-2"],
    }, own)).toBe(false);
    expect(isPlacementJobTargetCohort({
      allowedProgramIds: ["program-2"],
      allowedCohortIds: ["cohort-1"],
    }, own)).toBe(false);
  });
});
