import { describe, expect, it } from "vitest";
import { buildHrApplicantCsv, HR_APPLICANT_EXPORT_CAP } from "@/modules/placements/hr-applicant-export-model";
import type { SharedApplicant } from "@/modules/placements/hr-job-applicants-model";

const applicant: SharedApplicant = {
  id: "application-1", name: "=HYPERLINK(\"https://malicious.test\")",
  role: "+SUM(1,2)", status: "SUBMITTED", screening: "SHORTLISTED",
  submittedAt: new Date("2026-10-14T19:00:00Z"), email: "private@example.test",
};

describe("recruiter shared applicant CSV", () => {
  it("formula-neutralizes text and never emits learner email", () => {
    const result = buildHrApplicantCsv([applicant], 1);
    expect(result.csv).toContain("'=HYPERLINK");
    expect(result.csv).toContain("'+SUM(1,2)");
    expect(result.csv).toContain("Masked");
    expect(result.csv).not.toContain("private@example.test");
    expect(result.csv).toContain("15/10/2026");
    expect(result.exported).toBe(1);
  });

  it("caps rows and reports omitted records without exporting more than allowed", () => {
    const rows = Array.from({ length: HR_APPLICANT_EXPORT_CAP + 2 }, (_, i) => ({
      ...applicant, id: "application-" + i,
    }));
    const result = buildHrApplicantCsv(rows, rows.length);
    expect(result.exported).toBe(HR_APPLICANT_EXPORT_CAP);
    expect(result.omitted).toBe(2);
    expect(result.csv).toContain("Export capped");
  });
});
