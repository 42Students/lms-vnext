import { describe, expect, it } from "vitest";
import { readAdminPromotionParams, summarizeAdminPromotion } from "@/modules/academics/admin-batch-promotion-read-model";
describe("Super Admin read-only batch promotion preview", () => {
  it("rejects duplicated and forged identifiers", () => {
    expect(readAdminPromotionParams({ cohortId: ["a", "b"] }).success).toBe(false);
    expect(readAdminPromotionParams({ cohortId: "not-a-uuid" }).success).toBe(false);
    expect(readAdminPromotionParams({ yearStart: "1800" }).success).toBe(false);
  });
  it("does not equate a truncated preview with readiness", () => {
    expect(summarizeAdminPromotion({ blockers: ["PREVIEW_TOO_LARGE"],
      checkedLearners: 2000, blockedLearners: 0, completePreview: false,
      plan: { action: "PROMOTE", targetTermNumber: 4 } })).toEqual({
      action: "PROMOTE", targetTerm: 4, learnersChecked: 2000,
      blockedLearners: 0, completePreview: false, knownBlockers: 1,
    });
  });
});
