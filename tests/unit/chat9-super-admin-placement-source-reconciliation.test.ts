import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Placements documented parity and owner-accepted navigation",()=>{
 it("SA-placements-projects-04 restores the legacy Drives landing and no-college wording",()=>{
  const s=source("src/app/(authenticated)/admin/placements/page.tsx");
  for(const word of ['title="Placement Drives"',"Run active hiring drives from one operational view","Select a college to continue","Drives is college-scoped."])
   expect(s).toContain(word);
 });
 it("SA-placements-projects-15 guards unsaved changes on create and edit while preserving draft text",()=>{
  const create=source("src/components/placements/placement-job-create-form.tsx");
  const edit=source("src/components/placements/placement-draft-edit-form.tsx");
  const guard=source("src/components/placements/use-unsaved-drive-guard.ts");
  expect(create).toContain("useUnsavedDriveGuard()");
  expect(edit).toContain("useUnsavedDriveGuard()");
  expect(guard).toContain('window.addEventListener("beforeunload", beforeUnload)');
  expect(create).toContain("dirty");
  expect(edit).toContain("clearDirty()");
 });
 it("SA-placements-projects-16 links a missing active season to the manager instead of crashing",()=>{
  const s=source("src/components/placements/placement-job-create-form.tsx");
  expect(s).toContain("No active placement season.");
  expect(s).toContain("Open placement seasons");
  expect(s).toContain("disabled={pending || !activeSeason}");
 });
 it("SA-placements-projects-24 implements global Verified by 42 with a not-verified filter",()=>{
  const page=source("src/app/(authenticated)/admin/companies/page.tsx");
  const component=source("src/components/admin/super-admin-company-verification.tsx");
  expect(page).toContain("<SuperAdminCompanyVerification");
  expect(page).toContain("Only not verified");
  expect(page).toContain("Verified by 42");
  expect(component).toContain("/api/admin/companies/verification");
  expect(component).toContain("Confirm unverify");
 });
 it("SA-placements-projects-26 implements globally scoped Edit company with a confirmed API write",()=>{
  const page=source("src/app/(authenticated)/admin/companies/page.tsx");
  const component=source("src/components/admin/super-admin-company-edit.tsx");
  expect(page).toContain("<SuperAdminCompanyEdit");
  expect(component).toContain("Edit global company");
  expect(component).toContain("/api/admin/companies/edit");
  expect(component).toContain('method:"PATCH"');
 });
 it("SA-placements-projects-27 maintains company domains with removal guard and provider-side authorization",()=>{
  const page=source("src/app/(authenticated)/admin/companies/page.tsx");
  const component=source("src/components/admin/super-admin-company-identities.tsx");
  const route=source("src/app/api/admin/companies/domains/route.ts");
  expect(page).toContain("<SuperAdminCompanyIdentities");
  expect(component).toContain("Company domain or email");
  expect(component).toContain("domains.length<=1");
  expect(route).toContain("isSameOriginRequest");
 });
 it("SA-placements-projects-28 records other names and includes them in company directory search",()=>{
  const component=source("src/components/admin/super-admin-company-identities.tsx");
  const directory=source("src/modules/placements/admin-company-directory-service.ts");
  expect(component).toContain("Company other name");
  expect(component).toContain("aliases");
  expect(directory).toContain("placementCompanyAliases.alias");
 });
 it("SA-placements-projects-30 enables college-scoped company create, relationship lifecycle and drive-dependent delete guard",()=>{
  const page=source("src/app/(authenticated)/admin/companies/page.tsx");
  const control=source("src/components/admin/super-admin-college-company-actions.tsx");
  expect(page).toContain("<SuperAdminCollegeCompanyCreate");
  expect(page).toContain("<SuperAdminCollegeCompanyRelationshipActions");
  expect(control).toContain("Cannot delete a company with drives");
  expect(control).toContain("Restore company");
  expect(control).toContain('"/api/placements/companies"');
 });
 it("SA-placements-projects-36 uses recruiter accounts and readable Active or Suspended status labels",()=>{
  const page=source("src/components/admin/super-admin-hr-accounts.tsx");
  const dialog=source("src/components/admin/super-admin-hr-account-dialog.tsx");
  expect(page).toContain('title="Recruiter accounts"');
  expect(page).toContain("Add recruiter");
  expect(page).toContain('"Active":"Disabled"');
  expect(page).toContain('"Suspended"');
  expect(dialog).toContain('"Add recruiter"');
 });
 it("SA-placements-projects-43 links Placement Analytics as the canonical full-funnel page",()=>{
  const nav=source("src/modules/placements/super-admin-placement-nav-model.ts");
  const analytics=source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(nav).toContain('{href:"/admin/placements/analytics",label:"Placement Analytics"}');
  expect(analytics).toContain('title="Placement Analytics"');
  expect(analytics).toContain("Track the hiring funnel, conversion and company performance");
 });
 it("SA-placements-projects-44 restores Super Admin Interviews heading and its legacy subtitle",()=>{
  const s=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(s).toContain('"Interviews" : "Placement Interview Calendar"');
  expect(s).toContain("Review the interview schedule, conflicts and candidate context without leaving the placements workspace.");
 });
 it("SA-placements-projects-50 provides one canonical Interviews link and collapses additional reports",()=>{
  const nav=source("src/modules/placements/super-admin-placement-nav-model.ts");
  const view=source("src/components/admin/super-admin-placement-oversight-nav.tsx");
  expect(nav).toContain('{href:"/admin/placements/calendar",label:"Interviews"}');
  expect(nav).toContain('{href:"/admin/placements/applications",label:"Applications"}');
  expect(nav).not.toContain("/admin/placements/interviews");
  expect(view).toContain("<details");
  expect(view).toContain("More placement reports");
 });
});
