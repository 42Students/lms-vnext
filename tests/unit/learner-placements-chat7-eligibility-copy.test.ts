import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { learnerJobAvailabilityBanner } from "@/modules/placements/learner-job-availability-banner-model";
import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";

const base = {
  job: { id: "job", title: "Drive", description: "", employmentType: "FULL_TIME", workMode: "ONSITE",
    locations: [], openings: 1, minimumAnnualCtcInr: null, maximumAnnualCtcInr: null,
    applicationMode: "INTERNAL", externalApplicationUrl: null, applicationDeadline: null },
  roleOption: { id: "role", title: "Engineer", employmentType: "FULL_TIME", workMode: "ONSITE",
    locations: [], openings: 1, minimumAnnualCtcInr: null, maximumAnnualCtcInr: null, isPrimary: true },
  company: { id: "company", name: "Employer", websiteUrl: null },
  application: null,
  eligibility: { status: "INELIGIBLE" as const, checks: [], override: null },
  deadlinePassed: false, canApply: false,
} satisfies LearnerPlacementJobItem;

describe("learner eligibility headlines", () => {
  it("LEARNER-placements-26 truthful legacy eligibility titles and registration route", () => {
    expect(learnerJobAvailabilityBanner([{ ...base, canApply: true }])?.title).toBe("You can apply");
    expect(learnerJobAvailabilityBanner([base])?.title).toBe("You can't apply to this drive");
    expect(learnerJobAvailabilityBanner([{ ...base, deadlinePassed: true }])?.kind).toBe("CLOSED");
    const ui = readFileSync(new URL("../../src/components/placements/learner-placement-job-detail.tsx", import.meta.url), "utf8");
    expect(ui).toContain('href="/learn/my-placements#registration"');
    expect(ui).toContain("Register for placements");
    expect(ui).toContain('availability.kind==="NOT_OPEN" || availability.kind==="EVIDENCE"');
  });
});
