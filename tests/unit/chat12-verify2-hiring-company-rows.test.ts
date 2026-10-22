import { describe, expect, it } from "vitest";
import { hiringCompanyPageRows, type SuperAdminHiringRow } from "@/modules/admin-ui/super-admin-hiring-report-model";

const row = (jobId: string, companyId: string, companyName: string, applications: number): SuperAdminHiringRow => ({
  jobId, jobTitle: "Engineer " + jobId, companyId, companyName,
  totalApplications: applications, applied: applications, shortlisted: applications - 1,
  assessment: 0, interview: 0, offered: 0, hired: 0,
  rejected: 0, withdrawn: 0, waitlisted: 0,
});

describe("chat-12 verification round 2: legacy company-wise report placement", () => {
  it("puts full company totals immediately before the group's job rows, omitting singleton totals", () => {
    const a = row("a", "company-a", "Acme", 4);
    const b = row("b", "company-a", "Acme", 5);
    const c = row("c", "company-b", "Single", 2);
    const result = hiringCompanyPageRows([a, b, c], [a, b, c]);
    expect(result.map(entry => entry.jobId)).toEqual(["total:company-a", "a", "b", "c"]);
    expect(result[0]).toMatchObject({ companyName: "Acme", totalApplications: 9, shortlisted: 7 });
  });

  it("includes company totals across page boundaries, never an unrelated company's total", () => {
    const a = row("a", "company-a", "Acme", 4);
    const b = row("b", "company-a", "Acme", 5);
    const c = row("c", "company-b", "Single", 2);
    expect(hiringCompanyPageRows([a,b,c], [b,c]).map(entry => entry.jobId))
      .toEqual(["total:company-a", "b", "c"]);
    expect(hiringCompanyPageRows([a,b,c], [c]).map(entry => entry.jobId)).toEqual(["c"]);
  });

  it("normalizes only unlinked legacy company names, not tenant-owned company UUIDs", () => {
    const a = row("a", "", "Example Corp", 1);
    const b = row("b", "", " example corp ", 2);
    const c = row("c", "different-company", "Example Corp", 3);
    const result = hiringCompanyPageRows([a,b,c], [a,b,c]);
    expect(result.map(entry => entry.jobId)).toEqual(["total:legacy:example corp", "a", "b", "c"]);
    expect(result[0]?.totalApplications).toBe(3);
  });
});
