import { describe, expect, it } from "vitest";
import {
  deriveProjectRiskReasons,
  latestProjectSubmission,
} from "@/modules/projects/risk-signals";

describe("chat-13 IIT Dharwad adversarial project admin risk projection", () => {
  it("PROJ-BREAK-SA-38 never renders a corrupt activity age as an Infinity/NaN/fractional customer-facing message", () => {
    for (const inactiveDays of [
      Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY,
      -1, -9, 7.5, Number.MAX_SAFE_INTEGER + 1,
    ]) {
      const actual = deriveProjectRiskReasons({
        projectStatus: "ACTIVE",
        inactiveDays,
        latestSubmissionStatus: "SUBMITTED",
        hasBlockedTask: true,
      });
      expect(actual).toEqual(["Active blocker", "Pending review"]);
      expect(actual.join(" ")).not.toMatch(/NaN|Infinity|\d+\.\d+ days/);
    }
    expect(deriveProjectRiskReasons({
      projectStatus: "ACTIVE", inactiveDays: 7,
      latestSubmissionStatus: null,
    })).toEqual(["No activity in 7 days"]);
    expect(deriveProjectRiskReasons({
      projectStatus: "ACTIVE", inactiveDays: 6,
      latestSubmissionStatus: null,
    })).toEqual([]);
  });

  it("PROJ-BREAK-SA-39 ignores historical submissions after a newer revision and never flags archived delivery for pending review", () => {
    const versions = [
      { id: "older", version: 1, status: "SUBMITTED" },
      { id: "newer", version: 3, status: "APPROVED" },
      { id: "middle", version: 2, status: "SUBMITTED" },
    ] as const;
    expect(latestProjectSubmission(versions)?.id).toBe("newer");
    expect(latestProjectSubmission([...versions].reverse())?.id).toBe("newer");
    expect(latestProjectSubmission([])).toBeNull();
    expect(deriveProjectRiskReasons({
      projectStatus: "ACTIVE", inactiveDays: 1,
      latestSubmissionStatus: latestProjectSubmission(versions)?.status ?? null,
    })).not.toContain("Pending review");
    expect(deriveProjectRiskReasons({
      projectStatus: "ACTIVE", inactiveDays: 1,
      latestSubmissionStatus: "SUBMITTED",
    })).toContain("Pending review");
    for (const projectStatus of ["COMPLETED", "ARCHIVED"]) {
      expect(deriveProjectRiskReasons({
        projectStatus, inactiveDays: 120,
        latestSubmissionStatus: "SUBMITTED",
        hasBlockedTask: true,
      })).toEqual([]);
    }
  });
});
