import { describe, expect, it } from "vitest";
import {
  ACCREDITATION_CSV_HEADINGS,
  buildAccreditationExport,
  type AccreditationFacts,
} from "@/modules/placements/report-accreditation-model";

const period = {
  name: "2026-27",
  code: "2026-27",
  startDate: "2026-07-01",
  endDate: "2027-06-30",
};

const facts: AccreditationFacts = {
  jobs: [
    { id: "j1", title: "Engineer", companyId: "c1", companyName: "=FORMULA()", employmentType: "FULL_TIME", countsAsPlaced: true },
    { id: "j2", title: "Analyst", companyId: "c2", companyName: "Normal Company", employmentType: "INTERNSHIP", countsAsPlaced: false },
  ],
  applications: [
    { id: "a1", jobId: "j1", membershipId: "m1", status: "SUBMITTED", screeningStatus: null },
    { id: "a2", jobId: "j2", membershipId: "m1", status: "SUBMITTED", screeningStatus: null },
    { id: "a3", jobId: "j1", membershipId: "m2", status: "SUBMITTED", screeningStatus: null },
  ],
  offers: [
    { id: "o1", jobId: "j1", membershipId: "m1", status: "ACCEPTED", annualCtcInr: 800000, joiningStatus: null },
    { id: "o2", jobId: "j2", membershipId: "m1", status: "ACCEPTED", annualCtcInr: 200000, joiningStatus: null },
  ],
  branches: [
    { membershipId: "m1", departmentId: "d1", departmentName: "+Danger", },
    { membershipId: "m2", departmentId: "d2", departmentName: "Electrical", },
  ],
};

describe("accreditation evidence CSV", () => {
  it("counts unique placed learners while preserving offer records", () => {
    const result = buildAccreditationExport(period, facts);
    const overall = result.rows.find((row) => row[0] === "Overall");
    expect(overall?.[8]).toBe(2);
    expect(overall?.[9]).toBe(2);
    expect(overall?.[10]).toBe(1);
    expect(result.report.metrics.studentsPlaced).toBe(1);
    expect(result.report.metrics.applicants).toBe(2);
  });

  it("leaves unknown graduation denominators and placement rates blank", () => {
    const result = buildAccreditationExport(period, facts);
    for (const row of result.rows.filter((item) => ["Overall", "Branch", "Company"].includes(String(item[0])))) {
      expect(row[13]).toBeNull();
      expect(row[14]).toBeNull();
    }
    expect(result.issues.some((issue) => issue.toLowerCase().includes("denominator"))).toBe(true);
    expect(ACCREDITATION_CSV_HEADINGS).toHaveLength(16);
  });

  it("neutralizes spreadsheet formulas in company and branch names", () => {
    const result = buildAccreditationExport(period, facts);
    expect(result.csv).toContain("\"'=FORMULA()\"");
    expect(result.csv).toContain("\"'+Danger\"");
    expect(result.csv).not.toContain(",=FORMULA(),");
  });

  it("reports unknown branch attribution without assigning it to another branch", () => {
    const result = buildAccreditationExport(period, { ...facts, branches: [] });
    expect(result.missingBranches).toBe(2);
    expect(result.issues.some((issue) => issue.includes("2 distinct learners"))).toBe(true);
  });

  it("does not fabricate placement totals when no season exists", () => {
    const result = buildAccreditationExport(null, {
      jobs: [], applications: [], offers: [], branches: [],
    });
    expect(result.rows.every((row) => row[0] === "Completeness warning")).toBe(true);
    expect(result.issues[0]).toContain("No placement season");
  });

  it("does not mutate source facts", () => {
    const jobs = [...facts.jobs];
    buildAccreditationExport(period, facts);
    expect(facts.jobs).toEqual(jobs);
  });
});
