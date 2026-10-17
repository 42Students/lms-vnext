import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(file:string)=>readFileSync(file,"utf8");
describe("Super Admin legacy people roster verified gaps",()=>{
 it("SA-academics-people-89 faculty roster has department and type filters with bounded search",()=>{
  const ui=source("src/components/admin/admin-scoped-read-page.tsx");
  const api=source("src/modules/admin-ui/super-admin-scoped-people-service.ts");
  expect(ui).toContain("All departments");
  expect(ui).toContain("Faculty type");
  expect(ui).toContain("AdminScopedLiveSearch");
  expect(api).toContain("query.employmentType");
  expect(api).toContain("query.departmentId");
 });
 it("SA-academics-people-98 student roster filters department program batch class and search roll",()=>{
  const ui=source("src/components/admin/admin-scoped-read-page.tsx");
  const api=source("src/modules/admin-ui/super-admin-scoped-people-service.ts");
  for(const label of ['"programId"','"cohortId"','"sectionId"'])expect(ui).toContain(label);
  expect(api).toContain("learnerProfiles.rollNumber");
  expect(api).toContain("query.sectionId");
  expect(api).toContain("query.programId");
 });
 it("SA-academics-people-102 teaching assignments include class filter and semester-year-role CSV",()=>{
  const page=source("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  const svc=source("src/modules/admin-ui/super-admin-faculty-assignments-service.ts");
  expect(page).toContain("classOptions={classes}");
  expect(page).toContain('exportFilename="faculty-assignments.csv"');
  expect(svc).toContain('"Semester: "');
  expect(svc).toContain('"Teaching role: "');
 });
 it("SA-academics-people-104 People Directory exposes legacy All contacts Faculty and Students tabs",()=>{
  const page=source("src/app/(authenticated)/admin/people/directory/page.tsx");
  expect(page).toContain('title="People Directory"');
  for(const label of ['"All contacts"','"Faculty"','"Students"'])expect(page).toContain(label);
  expect(page).toContain('aria-label="People directory tabs"');
 });
 it("SA-academics-people-105 membership directory has contact search page sizing filters and CSV",()=>{
  const page=source("src/app/(authenticated)/admin/people/page.tsx");
  for(const name of ["Search contacts",'"pageSize"','"role"','"status"','"Search contacts..."','"Clear filters"'])expect(page).toContain(name);
  expect(page).toContain("SuperAdminPeopleCsvControl");
 });
 it("SA-academics-people-107 People membership page exports selected college contacts",()=>{
  const page=source("src/app/(authenticated)/admin/people/page.tsx");
  expect(page).toContain("superAdminPeopleExportHref({q,role,membershipStatus:status})");
  expect(page).toContain("SuperAdminPeopleCsvControl");
 });
 it("SA-academics-people-113 recruiter list shows status counts actions and terminate sessions drawer",()=>{
  const list=source("src/components/admin/super-admin-hr-accounts.tsx");
  const drawer=source("src/components/admin/super-admin-hr-detail-drawer.tsx");
  expect(list).toContain("statusSummary.accounts");
  expect(list).toContain("statusSummary.archived");
  expect(list).toContain("quickStatus(account)");
  expect(drawer).toContain("Terminate all sessions");
 });
 it("SA-academics-people-116 faculty and students roster links restore per-person lifecycle actions",()=>{
  for(const kind of ["faculty","students"]){
   const page=source("src/app/(authenticated)/admin/"+kind+"/page.tsx");
   expect(page).toContain("ScopedMembershipLifecycleActions");
   expect(page).toContain("CollegePersonEditAction");
   expect(page).toContain('href="/admin/people"');
  }
 });
});
