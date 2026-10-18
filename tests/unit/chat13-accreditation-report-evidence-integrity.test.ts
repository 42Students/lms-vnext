import { describe, expect, it } from "vitest";
import {
  buildAccreditationExport,
  ACCREDITATION_CSV_HEADINGS,
  type AccreditationFacts,
} from "@/modules/placements/report-accreditation-model";

describe("chat-13 Super Admin accreditation evidence-only report adversarial reconciliation", () => {
  const facts: AccreditationFacts = {
    jobs: [
      { id: "job-a", title: "Engineer", companyId: "company-a",
        companyName: "\u200b@HYPERLINK(1)", employmentType: "FULL_TIME" },
    ],
    applications: [
      { id: "app-a", jobId: "job-a", membershipId: "student-a",
        status: "SUBMITTED", screeningStatus: null },
      { id: "app-b", jobId: "job-a", membershipId: "student-b",
        status: "SUBMITTED", screeningStatus: null },
    ],
    offers: [
      { id: "offer-a", jobId: "job-a", membershipId: "student-a",
        status: "ACCEPTED", kind: "OFFER", annualCtcInr: 600_000,
        joiningStatus: null },
      { id: "loi-b", jobId: "job-a", membershipId: "student-b",
        status: "ACCEPTED", kind: "LOI", annualCtcInr: 50_000_000,
        joiningStatus: null },
    ],
    branches: [
      { membershipId: "student-a", departmentId: "d", departmentName: "\u20dd+SUM(1,2)" },
      { membershipId: "student-b", departmentId: "d", departmentName: "\u20dd+SUM(1,2)" },
    ],
  };

  it("SA-ACCREDITATION-10 reports only accepted real-OFFER CTC, blank official denominator and protected CSV cells", () => {
    const report = buildAccreditationExport({
      name: "\u034f=HYPERLINK(1)", code: "2027",
      startDate: "2027-06-01", endDate: "2028-05-31",
    }, facts);
    expect(report.report.metrics).toMatchObject({
      drives: 1, applicants: 2, acceptedOffers: 2,
      studentsPlaced: 1, averagePackageInr: 600_000,
      highestPackageInr: 600_000,
    });
    const overall = report.rows.find(row => row[0] === "Overall");
    expect(overall).toBeDefined();
    expect(overall?.[13]).toBeNull();
    expect(overall?.[14]).toBeNull();
    expect(report.csv).toContain('"\'\u034f=HYPERLINK(1)"');
    expect(report.csv).toContain('"\'\u200b@HYPERLINK(1)"');
    expect(report.csv).toContain('"\'\u20dd+SUM(1,2)"');
    expect(report.csv).toContain(ACCREDITATION_CSV_HEADINGS[0]);
    expect(report.issues.some(issue => /not an official|not an official/i.test(issue))).toBe(true);
  });

  it("SA-ACCREDITATION-11 refuses to certify placement rate or guess a missing season", () => {
    const empty: AccreditationFacts = {
      jobs: [], applications: [], offers: [], branches: [],
    };
    const noSeason = buildAccreditationExport(null, empty);
    expect(noSeason.rows.some(row => row[0] === "Overall")).toBe(false);
    expect(noSeason.rows.every(row => row[0] === "Completeness warning")).toBe(true);
    expect(noSeason.issues.some(issue => issue.includes("No placement season"))).toBe(true);
    expect(noSeason.report.metrics.placementRatePercent).toBeNull();
    expect(noSeason.csv).toContain("Not certified");
  });
});
