import { describe, expect, it } from "vitest";
import { deriveProjectRiskReasons } from "@/modules/projects/risk-signals";
import { canAdminSettleDelivery } from "@/modules/projects/admin-submission-review-model";

describe("PROJ-BREAK-SA-40 Project Admin risk badges must reflect actionable review state", () => {
  it("never renders a pending-review badge in projects whose delivery state machine refuses review", () => {
    for (const status of [
      "PLANNED", "COMPLETED", "ARCHIVED", "DELETED", "UNKNOWN",
    ]) {
      const reasons = deriveProjectRiskReasons({
        projectStatus: status,
        inactiveDays: 0,
        latestSubmissionStatus: "SUBMITTED",
      });
      expect(reasons, status).not.toContain("Pending review");
      expect(
        canAdminSettleDelivery("SUBMITTED", false, status, "APPROVED"),
      ).toBe(false);
      expect(
        canAdminSettleDelivery("SUBMITTED", false, status, "CHANGES_REQUESTED"),
      ).toBe(false);
    }
  });
  it("preserves a valid pending-review signal and independent planned-workspace staleness", () => {
    expect(deriveProjectRiskReasons({
      projectStatus: "ACTIVE",
      inactiveDays: 0,
      latestSubmissionStatus: "SUBMITTED",
    })).toEqual(["Pending review"]);
    expect(deriveProjectRiskReasons({
      projectStatus: "ACTIVE",
      inactiveDays: 7,
      latestSubmissionStatus: "SUBMITTED",
      hasBlockedTask: true,
    })).toEqual(["No activity in 7 days", "Active blocker", "Pending review"]);
    expect(deriveProjectRiskReasons({
      projectStatus: "PLANNED",
      inactiveDays: 7,
      latestSubmissionStatus: "SUBMITTED",
    })).toEqual(["No activity in 7 days"]);
  });
});
