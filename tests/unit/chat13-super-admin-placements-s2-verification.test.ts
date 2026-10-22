import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Source wiring contracts; DB and browser tests are separate acceptance gates.
const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Chat 13 Super Admin placement S1/S2 source contracts", () => {
  it("SA-placements-projects-25 merge transaction", () => {
    const code = source("src/modules/placements/admin-company-merge-service.ts");
    expect(code).toContain("db.transaction(");
    expect(code).toContain("MERGE_SOURCE_SHARED_OUTSIDE_COLLEGE");
    expect(code).toContain("placementRecruiterCollegeGrants");
    expect(code).toContain("placementJobs");
    expect(code).toContain("status:\"ARCHIVED\"");
  });
  it("SA-placements-projects-01 policy editor", () => {
    const code = source("src/components/placements/super-admin-platform-placement-policy.tsx");
    expect(code).toContain("Placements policy");
    expect(code).toContain("Reset to default");
    expect(code).toContain("/api/admin/placements/platform-policy");
  });
  it("SA-placements-projects-02 active-drive search", () => {
    const code = source("src/components/placements/super-admin-drive-quick-search.tsx");
    expect(code).toContain("Search by drive or company");
    expect(code).toContain("Active drives");
    expect(code).toContain('href={basePath+"/jobs/"+encodeURIComponent(job.id)}');
  });
  it("SA-placements-projects-06 draft clone", () => {
    const code = source("src/components/placements/super-admin-drive-duplicate.tsx");
    expect(code).toContain("Duplicate as new drive");
    expect(code).toContain("/api/admin/placements/jobs/");
    expect(code).toContain("router.refresh()");
  });
  it("SA-placements-projects-07 deadline extension", () => {
    const code = source("src/components/placements/super-admin-drive-deadline.tsx");
    expect(code).toContain("Extend deadline");
    expect(code).toContain("confirmed:true");
    expect(code).toContain("later than the existing deadline");
  });
  it("SA-placements-projects-10 drives table", () => {
    const code = source("src/app/(authenticated)/admin/placements/drives/page.tsx");
    expect(code).toContain("All drives");
    expect(code).toContain("pageSize");
    expect(code).toContain('title="Jobs Management (LMS)"');
  });
  it("SA-placements-projects-17 drive navigation", () => {
    const code = source("src/app/(authenticated)/admin/placements/jobs/[jobId]/layout.tsx");
    expect(code).toContain("Drive breadcrumb");
    expect(code).toContain("<AdminPlacementJobTabs basePath={base} />");
    const tabs=source("src/app/(authenticated)/admin/placements/jobs/[jobId]/admin-placement-job-tabs.tsx");
    for(const label of ["Overview","Applications","Schedule","Settings"])expect(tabs).toContain(label);
  });
  it("SA-placements-projects-19 academic applicant filters", () => {
    const code = source("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx");
    expect(code).toContain("name=\"source\"");
    expect(code).toContain("name=\"departmentId\"");
    expect(code).toContain("name=\"programId\"");
    expect(code).toContain("name=\"cohortId\"");
  });
  it("SA-placements-projects-31 company history", () => {
    const code = source("src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx");
    expect(code).toContain("Drives run");
    expect(code).toContain("Total applications");
    expect(code).toContain("Open drive");
  });
  it("SA-placements-projects-34 recruiter grant expiry", () => {
    const code = source("src/modules/placements/super-admin-hr-service.ts");
    expect(code).toContain("validUntil: expiration");
    expect(code).toContain("grantScopeClause(context)");
  });
  it("SA-placements-projects-38 recruiter scope safety", () => {
    const code = source("src/components/admin/super-admin-hr-accounts.tsx");
    expect(code).toContain("accountManageable");
    expect(code).toContain("scopeDescription");
    expect(code).toContain("statusSummary");
  });
  it("SA-placements-projects-40 hiring filters", () => {
    const code = source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
    expect(code).toContain("appliedFrom");
    expect(code).toContain("appliedTo");
    expect(code).toContain("departmentId");
    expect(code).toContain("cohortId");
    expect(code).toContain("Refresh");
  });
  it("SA-placements-projects-42 company report", () => {
    const code = source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
    expect(code).toContain("COMPANY_HIRING_COLUMNS");
    expect(code).toContain("Export report");
    expect(code).toContain("/api/admin/placements/hiring-report/export?");
    expect(code).toContain("Company total");
  });
  it("SA-placements-projects-49 announcement receipts", () => {
    const code = source("src/app/(authenticated)/admin/announcements/page.tsx");
    expect(code).toContain("Placement-cell read receipts");
    expect(code).toContain("getSuperAdminBroadcastReceiptCounts");
    expect(code).toContain('<MetricBar role="progressbar"');
  });
});
