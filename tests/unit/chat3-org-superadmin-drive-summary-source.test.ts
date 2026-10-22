import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("legacy org-scope jobs summary in Super Admin placements",()=>{
 it("shows organization-wide read-only evidence only via the central scoped report",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/placements/page.tsx","utf8");
  expect(page).toContain("!collegeId&&context.adminScope?.organizationId");
  expect(page).toContain("getSuperAdminCompanyHiringReport(context,{})");
  expect(page).toContain('Organization drives · read-only');
  expect(page).toContain("organizationJobs.data.rows.slice(0,25)");
  expect(page).toContain("organizationJobs.data.fullTotals.totalApplications");
  expect(page).toContain("No unverified rows are shown.");
  expect(page).toContain("Select a college to continue");
  const service=readFileSync("src/modules/admin-ui/super-admin-hiring-report-service.ts","utf8");
  expect(service).toContain('isSuperAdmin(context)');
  expect(service).toContain('requirePermission(context,"placements.read"');
  expect(service).toContain("selected.organizationId?eq(colleges.organizationId,selected.organizationId)");
 });
});
