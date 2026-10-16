import { describe, expect, it } from "vitest";
import { batchEligibilityShare, summarizeBatchEligibility } from "@/modules/placements/tpo-batch-eligibility-summary-model";
import type { PlacementScopeDecision } from "@/modules/placements/batch-eligibility-policy";

const decision = (status: "ELIGIBLE" | "INELIGIBLE"): PlacementScopeDecision => ({
  status, reason: status === "INELIGIBLE" ? "Not eligible" : null,
  note: null, decidedAt: new Date("2026-10-15T00:00:00Z"),
});

describe("TPO-batches-01 complete eligibility breakdown", () => {
  it("accounts for all active batch learners with inherited decisions", () => {
    const result = summarizeBatchEligibility([
      { membershipId: "a", sectionIds: [] },
      { membershipId: "b", sectionIds: ["class-a"] },
      { membershipId: "c", sectionIds: ["class-a", "class-b"] },
      { membershipId: "d", sectionIds: [] },
    ], {
      learner: new Map([["d",decision("ELIGIBLE")]]),
      section: new Map([["class-a",decision("INELIGIBLE")]]),
      cohort: decision("ELIGIBLE"),
    }, false);
    expect(result).toEqual({
      eligible: 2, ineligible: 1, undecided: 0, needsReview: 1, assessed: 4, complete: true,
    });
    expect(result.eligible+result.ineligible+result.undecided+result.needsReview).toBe(result.assessed);
    expect(batchEligibilityShare(result.eligible,result.assessed)).toBe(50);
  });
  it("does not invent percentages for an empty batch", () => {
    expect(batchEligibilityShare(0,0)).toBe(0);
    expect(batchEligibilityShare(1,3)).toBe(33.33);
  });
});
