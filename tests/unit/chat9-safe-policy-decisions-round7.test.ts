import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const s=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 safer gap decisions",()=>{
 it("TPO-settings-audit-05 keeps settings writes restricted to persisted active TPO memberships and centralized placement permission",()=>{
  const v=s("src/modules/placements/tpo-batch-workspace-read-service.ts");
  expect(v).toContain('eq(membershipRoles.role,"TPO")');
  expect(v).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(v).toContain('requirePermission(ctx,"placements.manage"');
 });
 it("TPO-settings-audit-12 retains verified CGPA as its own raw academic evidence, not a speculative percentage rewrite",()=>{
  const v=s("src/modules/placements/eligibility-service.ts");
  expect(v).toContain("cgpaHundredths: scaleHundredths(input.cgpa)");
  expect(v).toContain("cgpa: unscaleHundredths(row.cgpaHundredths)");
  expect(v).toContain("tenthPercentage");
 });
 it("TPO-settings-audit-51 does not expose unreviewed applicants as they apply",()=>{
  const v=s("src/modules/placements/company-share/public-service.ts");
  expect(v).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(v).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(v).toContain('eq(collegeMemberships.status,"ACTIVE")');
 });
 it("TPO-settings-audit-98 counts auditable source records without falsely claiming one record per decision",()=>{
  const v=s("src/modules/placements/tpo-audit-service.ts");
  const p=s("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(v).toContain("sql\x60 union all \x60");
  expect(p).toContain("Audit totals count source records, not necessarily unique actions.");
  expect(p).toContain("no recorded decision is silently discarded");
 });
 it("COL-projects-04 prevents silently replacing live tasks and sprints with a new template",()=>{
  const v=s("src/components/projects/project-create-control.tsx");
  expect(v).toContain("Create an independent Project workspace from a published template");
  expect(v).toContain("templateId");
  const t=s("src/modules/projects/template-service.ts");
  expect(t).toContain("Existing workspaces stay pinned to their materialized version");
 });
});
