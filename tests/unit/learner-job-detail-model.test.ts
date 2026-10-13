import { describe, expect, it } from "vitest";
import {
  learnerJobDetailSummary,
  safeLearnerPlacementUrl,
} from "@/modules/placements/learner-job-detail-model";
import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";

function item(roleId: string, status: "ELIGIBLE" | "INELIGIBLE", applied = false): LearnerPlacementJobItem {
  return {
    job: { id: "job1", title: "Campus Drive", description: "Engineering",
      employmentType: "FULL_TIME", workMode: "ONSITE", locations: ["Hyderabad"],
      openings: 5, minimumAnnualCtcInr: null, maximumAnnualCtcInr: null,
      applicationMode: "INTERNAL", externalApplicationUrl: null, applicationDeadline: null },
    roleOption: { id: roleId, title: "Engineer", employmentType: "FULL_TIME",
      workMode: "ONSITE", locations: ["Hyderabad"], openings: 3,
      minimumAnnualCtcInr: null, maximumAnnualCtcInr: null, isPrimary: true },
    company: { id: "c1", name: "Example Company", websiteUrl: "https://company.example" },
    eligibility: { status, checks: [{ criterion:"CGPA",
      status: status === "ELIGIBLE" ? "PASS" : "FAIL", actual: 6, required: 7,
      detail: "CGPA threshold" }], override: null },
    application: applied ? { id:"a1", channel:"INTERNAL", status:"SUBMITTED",
      eligibilityStatus:status, submittedAt:"2026-10-14T00:00:00Z", withdrawnAt:null } : null,
    deadlinePassed:false, canApply:status==="ELIGIBLE" && !applied,
  };
}

describe("Learner placement job detail", () => {
  it("summarizes role-based eligibility and existing applications without double allowing apply", () => {
    expect(learnerJobDetailSummary([
      item("role-a", "ELIGIBLE", true),
      item("role-b", "INELIGIBLE"),
    ])).toMatchObject({ jobId:"job1", rolesCount:2, appliedCount:1,
      canApplyCount:0, eligibleCount:1, ineligibleCount:1 });
  });
  it("rejects mixed jobs rather than showing another drive's eligibility", () => {
    expect(() => learnerJobDetailSummary([
      item("role-a","ELIGIBLE"),
      { ...item("role-b","ELIGIBLE"), job: { ...item("role-b","ELIGIBLE").job, id:"other" } },
    ])).toThrow("JOB_DETAIL_MIXED_JOBS");
  });
  it("returns no invented summary for an absent or unauthorized job", () => {
    expect(learnerJobDetailSummary([])).toBeNull();
  });
  it("permits only safe employer URL schemes and rejects embedded credentials", () => {
    expect(safeLearnerPlacementUrl("https://example.com/roles")).toBe("https://example.com/roles");
    expect(safeLearnerPlacementUrl("javascript:alert(1)")).toBeNull();
    expect(safeLearnerPlacementUrl("data:text/html,hi")).toBeNull();
    expect(safeLearnerPlacementUrl("https://admin:secret@example.com")).toBeNull();
    expect(safeLearnerPlacementUrl("//example.com")).toBeNull();
  });
});
