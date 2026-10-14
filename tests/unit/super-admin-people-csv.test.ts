import { describe,expect,it } from "vitest";
import { adminUsersExportQuerySchema,buildSuperAdminPeopleCsv,readSuperAdminPeopleExportParams,superAdminPeopleExportHref,SUPER_ADMIN_PEOPLE_CSV_CAP } from "@/modules/people/admin-users-export-model";
describe("Super Admin users CSV",()=>{
 it("enforces strict filters, no forged paging or college scope",()=>{
  expect(SUPER_ADMIN_PEOPLE_CSV_CAP).toBe(500);
  expect(adminUsersExportQuerySchema.safeParse({page:2}).success).toBe(false);
  expect(adminUsersExportQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(()=>readSuperAdminPeopleExportParams(new URLSearchParams("role=LEARNER&role=FACULTY"))).toThrow();
 });
 it("preserves validated tabs/search in the export URL",()=>{
  const href=superAdminPeopleExportHref({tab:"STUDENT",q:"A&B",platformStatus:"DISABLED"});
  expect(href).toContain("tab=STUDENT");
  expect(href).toContain("q=A%26B");
 });
 it("formula-neutralizes every exported field, no PII",()=>{
  const csv=buildSuperAdminPeopleCsv([{membershipId:"id",displayName:'=SUM(1,2) "Learner"',
   collegeName:"+unsafe",roles:["LEARNER"],platformStatus:"ACTIVE",membershipStatus:"ACTIVE",
   updatedAt:new Date("2026-10-15T02:00:00Z")}],false);
  expect(csv).toContain("'=SUM");
  expect(csv).toContain("'+unsafe");
  expect(csv).not.toContain("Email");
  expect(csv).not.toContain("Phone");
  expect(csv).toContain("IST");
 });
});
