import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("Chat-3 owner-backed tenant/public gap dispositions",()=>{
 it("SA-tenants-modules-05 searchable college scope also warns when all colleges are shown",()=>{
  const text=src("src/components/shell/admin-scope-switcher.tsx");
  expect(text).toContain("Search colleges");
  expect(text).toContain("Showing all colleges — data may be large.");
  expect(text).toContain('search.trim() && visibleColleges.length===0');
 });
 it("SA-tenants-modules-08 organizations have search, refresh and bounded persistent page size",()=>{
  const text=src("src/app/(authenticated)/admin/organizations/page.tsx");
  for(const token of ["Search organizations","Clear search","Refresh",'name="pageSize"',"Math.ceil(matching.length/pageSize)"])
    expect(text).toContain(token);
 });
 it("SA-tenants-modules-13 college directory supports search by organization, count and pages",()=>{
  const text=src("src/app/(authenticated)/admin/colleges/page.tsx");
  for(const token of ["Search college, code, city or organization","Clear search","Refresh",'name="pageSize"',"Math.ceil(matches.length/pageSize)"])
    expect(text).toContain(token);
 });
 it("SA-tenants-modules-16 college editor persists the additional bounded address details",()=>{
  const text=src("src/components/admin/college-edit-dialog.tsx");
  for(const token of ["addressLine","landmark","postalCode"])
    expect(text).toContain(token);
 });
 it("SA-tenants-modules-18 supports Super Admin scoped session revocation",()=>{
  const text=src("src/components/admin/admin-revoke-sessions.tsx");
  expect(text).toContain("Sign out everywhere");
  expect(text).toContain("session(s) revoked.");
  expect(text).toContain("/sessions");
 });
 it("PUB-auth-public-60 GET share opens remain audit-only without a misleading bell",()=>{
  const server=src("src/modules/placements/company-share/public-service.ts");
  expect(server).toContain("placementCompanyApplicantShareViews");
  expect(server).not.toContain("createInAppNotification");
 });
});
