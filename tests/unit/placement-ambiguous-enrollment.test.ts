import { describe, expect, it } from "vitest";
import { hasAmbiguousActivePlacementEnrollment } from "@/modules/placements/eligibility-service";

describe("D16 active cohort ambiguity is fail-closed", () => {
  const row = {cohortId:"cohort-a",programId:"program-a"};
  it("permits missing enrollment to retain normal missing-data behavior", () => {
    expect(hasAmbiguousActivePlacementEnrollment([])).toBe(false);
  });
  it("accepts exactly one enrolled academic program", () => {
    expect(hasAmbiguousActivePlacementEnrollment([row])).toBe(false);
  });
  it("rejects two rows even if they share a cohort", () => {
    expect(hasAmbiguousActivePlacementEnrollment([row,row])).toBe(true);
    expect(hasAmbiguousActivePlacementEnrollment([row,{...row,cohortId:"cohort-b"}])).toBe(true);
  });
});
