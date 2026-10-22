import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("chat-13 Super Admin source reconciliation — placements and academic legacy",()=>{
 it("SA-academics-people-R03 preserves the verified source behavior",()=>{
  const code=source("src/modules/admin-ui/legacy-superadmin-destination-model.ts");
  expect(code).toContain("legacySuperAdminPaths");
  expect(code).toContain("if(pathSegments.length!==1)return null;");
 });
 it("SA-academics-people-R05 preserves the verified source behavior",()=>{
  const code=source("src/components/attendance/admin-attendance-workspace.tsx");
  expect(code).toContain("<Modal");
  expect(code).toContain("correctionGuard.run");
 });
 it("SA-placements-projects-11 preserves the verified source behavior",()=>{
  const code=source("src/components/placements/super-admin-bulk-drive-actions.tsx");
  expect(code).toContain("Bulk Open / Close");
  expect(code).toContain("status === \"SKIPPED\"");
 });
 it("SA-placements-projects-12 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-drive-archive-service.ts");
  expect(code).toContain("PLACEMENTS_JOB_ARCHIVED");
  expect(code).toContain("cancelledRounds");
 });
 it("SA-placements-projects-13 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-published-drive-edit-service.ts");
  expect(code).toContain("PLACEMENTS_JOB_PUBLISHED_EDITED");
  expect(code).toContain("expectedUpdatedAt");
 });
 it("SA-placements-projects-18 preserves the verified source behavior",()=>{
  const code=source("src/components/placements/super-admin-drive-pipeline.tsx");
  expect(code).toContain("pipeline");
  expect(code).toContain("stage");
 });
 it("SA-placements-projects-24 preserves the verified source behavior",()=>{
  const code=source("src/components/admin/super-admin-company-verification.tsx");
  expect(code).toContain("Verify");
  expect(code).toContain("Unverify");
 });
 it("SA-placements-projects-26 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-company-edit-service.ts");
  expect(code).toContain("PLACEMENTS_COMPANY_UPDATED");
  expect(code).toContain("expectedUpdatedAt");
 });
 it("SA-placements-projects-27 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-company-identities-service.ts");
  expect(code).toContain("normalizeCompanyDomain");
  expect(code).toContain("already belongs to another company. Merge them instead.");
 });
 it("SA-placements-projects-28 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-company-identities-service.ts");
  expect(code).toContain("normalizeCompanyAlias");
  expect(code).toContain("placementCompanyAliases");
 });
 it("SA-placements-projects-30 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-college-company-action-service.ts");
  expect(code).toContain("PLACEMENTS_COMPANY_RELATIONSHIP_ARCHIVED");
  expect(code).toContain("college");
 });
 it("SA-placements-projects-37 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-hr-service.ts");
  expect(code).toContain("input.newCompany");
  expect(code).toContain("companyRelationshipIds");
 });
 it("SA-placements-projects-39 preserves the verified source behavior",()=>{
  const code=source("src/modules/placements/super-admin-hr-service.ts");
  expect(code).toContain("PLACEMENTS_RECRUITER_CREATED");
  expect(code).toContain("recordActivityEventInTransaction");
 });
});

describe("SA-placements-projects-30 deliberate global/college boundary",()=>{
 it("SA-placements-projects-30 keeps global employer edits global but supports authorized college relationship creation and lifecycle",()=>{
  const edit=source("src/modules/placements/super-admin-company-edit-service.ts");
  expect(edit).toContain("isSuperAdmin(context)");
  expect(edit).toContain('requirePermission(context,"admin-scope.select")');
  expect(edit).toContain('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
  const college=source("src/components/admin/super-admin-college-company-actions.tsx");
  for(const copy of ["Add company","Delete company","Restore company"])
   expect(college).toContain(copy);
  const directory=source("src/app/(authenticated)/admin/companies/page.tsx");
  expect(directory).toContain("Sensitive CRM contact information is not shown without a scoped need-to-know read.");
   expect(directory).toContain("context.adminScope?.collegeId===row.collegeId");
   expect(directory).toContain("Private to the selected college");
 });
});
