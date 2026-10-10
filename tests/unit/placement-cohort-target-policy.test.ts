import { describe, expect, it } from "vitest";
import { isPlacementJobTargetCohort } from "@/modules/placements/cohort-target-policy";

describe("W04 academic-batch Drive targeting", () => {
  const cse2027 = "11111111-1111-4111-8111-111111111111";
  const ece2027 = "22222222-2222-4222-8222-222222222222";
  const mech2027 = "33333333-3333-4333-8333-333333333333";

  it("fails closed when no cohorts have been selected for the drive", () => {
    expect(isPlacementJobTargetCohort(cse2027, [])).toBe(false);
    expect(isPlacementJobTargetCohort(null, [cse2027])).toBe(false);
  });

  it("accepts only the selected academic cohorts, regardless of department", () => {
    const targets = [cse2027, ece2027];
    expect(isPlacementJobTargetCohort(cse2027, targets)).toBe(true);
    expect(isPlacementJobTargetCohort(ece2027, targets)).toBe(true);
    expect(isPlacementJobTargetCohort(mech2027, targets)).toBe(false);
  });

  it("does not mistake branch or passing-year text for actual cohort IDs", () => {
    expect(isPlacementJobTargetCohort("CSE-2027", [cse2027])).toBe(false);
    expect(isPlacementJobTargetCohort("2027", [cse2027])).toBe(false);
  });
});
