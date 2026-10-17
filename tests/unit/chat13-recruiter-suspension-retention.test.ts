import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin recruiter suspend and reactivate",()=>{
 it("SA-placements-projects-35 retains college grants but revokes sessions on suspend",()=>{
  const source=read("src/modules/placements/super-admin-hr-service.ts");
  const update=source.slice(source.indexOf("export async function updateSuperAdminHrAccount("),
   source.indexOf("export async function grantSuperAdminHrCollegeAccess("));
  expect(update).not.toContain('status: "REVOKED"');
  expect(update).toContain('await terminateSuperAdminHrSessions(context,userId)');
  expect(update).toContain('input.status === "ARCHIVED"');
  expect(source).toContain("revokeAllSessionsForUser");
 });
 it("SA-placements-projects-35 warns that sign-in is disabled and access is retained",()=>{
  const source=read("src/components/admin/super-admin-hr-accounts.tsx");
  expect(source).toContain("cannot sign in until reactivated. College access is kept.");
  expect(source).toContain("Their existing college access is kept.");
  expect(source).not.toContain("active college grants were revoked");
 });
});
