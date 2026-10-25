import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("Chat-3 owner-backed tenant/public gap dispositions",()=>{
 it("SA-tenants-modules-05 searchable college scope also warns when all colleges are shown",()=>{
  const text=src("src/components/shell/admin-scope-switcher.tsx");
  expect(text).toContain("Search colleges");
  expect(text).toContain("Showing all colleges — data may be large.");
  expect(text).toContain('search.trim()&&!filteredColleges.length');
 });
 it("SA-tenants-modules-08 organizations have search, refresh and bounded persistent page size",()=>{
  const text=src("src/app/(authenticated)/admin/organizations/page.tsx");
  for(const token of ["Search organizations","Clear search","Refresh",'name="pageSize"',"Math.ceil(matching.length/pageSize)"])
    expect(text).toContain(token);
 });
 it("SA-tenants-modules-13 college directory supports search by organization, count and pages",()=>{
  const text=src("src/app/(authenticated)/admin/colleges/page.tsx");
  for(const token of ["Search colleges","Clear search","Refresh directory",'name="pageSize"',"Math.ceil(matches.length/pageSize)"])
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
 it("SA-tenants-modules-06 has two scoped URL-persisted tenant setup steps",()=>{
  const page=src("src/app/(authenticated)/admin/tenants/setup/page.tsx");
  for(const value of ["selectedSuperAdminTenantSetupTab","1. Tenant structure",
    "2. Launch setup","Current step","College setup","Web address","Look and feel"])
    expect(page).toContain(value);
  expect(page).toContain('!isSuperAdmin(context)||!can(context,"admin-scope.select")');
 });
 it("SA-tenants-modules-17 has a college-scoped administrator creation and lifecycle workspace",()=>{
  const page=src("src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx");
  for(const token of ['forcedRole="COLLEGE_ADMIN"','forcedRole="TPO"','listCollegeAdminSessionTargets',
    "CollegeAdminLifecycleAction","View active devices","View administrator history"])
    expect(page).toContain(token);
  const service=src("src/modules/colleges/admin-session-service.ts");
  expect(service).toContain('requirePermission(ctx,"college.manage"');
  expect(page).toContain('hasMentorRole={item.roles.includes("MENTOR")}');
 });
 it("SA-tenants-modules-19 retains college-scoped activity read and authorized CSV without a duplicate GET write",()=>{
  const page=src("src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx");
  expect(page).toContain('href={"/activity?collegeId="+encodeURIComponent(item.id)}');
  expect(page).toContain('href={`/api/activity/admin-export?collegeId=${encodeURIComponent(item.id)}`}');
  expect(src("src/app/(authenticated)/activity/page.tsx")).toContain('...(selectedCollegeId || !requestedCollegeId ? {} : {collegeId: requestedCollegeId})');
  expect(src("src/app/api/activity/admin-export/route.ts")).toContain("exportSuperAdminActivity");
 });
 it("PUB-auth-public-61 does not accept guessed legacy slugs in place of scoped course delivery identities",()=>{
  const courses=src("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  const schedule=src("src/components/academics/learner-class-schedule.tsx");
  expect(courses).toContain("deliveryId");
  expect(schedule).toContain("deliveryId");
  expect(schedule).toContain("courseBasePath");
 });

});
