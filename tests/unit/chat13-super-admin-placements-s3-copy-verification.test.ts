import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Chat 13 Super Admin placement legacy copy and S3 contracts", () => {
  it("SA-placements-projects-03 legacy summary counts", () => {
    const code = source("src/components/placements/placement-operations-overview.tsx");
    expect(code).toContain("Active drives");
    expect(code).toContain("Closed / draft");
    expect(code).toContain("All drives");
  });
  it("SA-placements-projects-08 retention report", () => {
    const code = source("src/app/(authenticated)/admin/placements/retention/page.tsx");
    expect(code).toContain("Data retention report");
    expect(code).toContain("showing first 200");
  });
  it("SA-placements-projects-23 shortlist export", () => {
    const code = source("src/app/(authenticated)/admin/placements/shortlisted/page.tsx");
    expect(code).toContain("shortlisted.csv");
    expect(code).toContain("exportPath");
  });
  it("SA-placements-projects-32 archived company restore", () => {
    const code = source("src/app/(authenticated)/admin/companies/page.tsx");
    expect(code).toContain("Show deleted (archived) companies");
    expect(code).toContain("SuperAdminCompanyRestore");
  });
  it("SA-placements-projects-33 company tabs", () => {
    const code = source("src/app/(authenticated)/admin/companies/page.tsx");
    expect(code).toContain("42&apos;s company list");
    expect(code).toContain("This college&apos;s companies");
  });
  it("SA-placements-projects-35 safe recruiter lifecycle", () => {
    const code = source("src/components/admin/super-admin-hr-accounts.tsx");
    // Owner decision keeps archive-as-suspend semantics instead of destructive delete.
    expect(code).toContain("Recruiter suspended");
    const service=source("src/modules/placements/super-admin-hr-service.ts");
    expect(service).toContain('input.status === "ARCHIVED"');
    expect(service).toContain('status: "REVOKED"');
    expect(code).toContain("Recruiter reactivated");
    expect(code).toContain("accountManageable");
  });
  it("SA-placements-projects-48 optional broadcast button", () => {
    const code = source("src/modules/announcements/super-admin-college-broadcast-model.ts");
    expect(code).toContain("buttonLabel");
    expect(code).toContain("buttonUrl");
    expect(code).toContain("Enter a secure HTTPS link");
  });
  it("SA-placements-projects-04 drive legacy copy", () => {
    const code = source("src/app/(authenticated)/admin/placements/page.tsx");
    expect(code).toContain("title=\"Placement Drives\"");
    expect(code).toContain("Run active hiring drives from one operational view.");
    expect(code).toContain("Select a college to continue");
    expect(code).toContain("Drives is college-scoped.");
  });
  it("SA-placements-projects-36 recruiter legacy copy", () => {
    const code = source("src/components/admin/super-admin-hr-accounts.tsx");
    expect(code).toContain("Add recruiter");
    expect(code).toContain("Recruiter account lifecycle");
    expect(code).toContain("title=\"Recruiter accounts\"");
  });
  it("SA-placements-projects-43 analytics legacy copy", () => {
    const code = source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
    expect(code).toContain("title=\"Placement Analytics\"");
    expect(code).toContain("Track the hiring funnel, conversion and company performance");
  });
  it("SA-placements-projects-44 interview legacy copy", () => {
    const code = source("src/components/placements/placement-calendar-workspace.tsx");
    expect(code).toContain("? \"Interviews\" : \"Placement Interview Calendar\"");
    expect(code).toContain("Review the interview schedule, conflicts and candidate context");
  });
});
