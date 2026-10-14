import { describe, expect, it } from "vitest";
import { HR_APPLICANT_PAGE_SIZE, hrApplicantPageBounds, hrApplicantFilterSchema } from "@/modules/placements/hr-job-applicants-model";

describe("HR applicant database paging contract", () => {
  it("bounds page size and computes ranges without skipping the final record", () => {
    expect(HR_APPLICANT_PAGE_SIZE).toBe(25);
    expect(hrApplicantPageBounds(1, 26)).toEqual({
      page: 1, pageSize: 25, pages: 2, first: 1, last: 25,
    });
    expect(hrApplicantPageBounds(2, 26)).toEqual({
      page: 2, pageSize: 25, pages: 2, first: 26, last: 26,
    });
    expect(hrApplicantPageBounds(4, 26).first).toBe(0);
  });

  it("refuses invalid pages and arbitrary filter values", () => {
    expect(hrApplicantFilterSchema.safeParse({ tab: "applicants", page: "2" }).success).toBe(true);
    expect(hrApplicantFilterSchema.safeParse({ page: "0" }).success).toBe(false);
    expect(hrApplicantFilterSchema.safeParse({ page: "10001" }).success).toBe(false);
    expect(hrApplicantFilterSchema.safeParse({ page: "2.5" }).success).toBe(false);
    expect(hrApplicantFilterSchema.safeParse({ page: "2", role: "private" }).success).toBe(false);
  });
});
