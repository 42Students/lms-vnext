import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {collegeRoleDirectoryHref,collegeRoleDirectoryQuerySchema} from "@/modules/people/college-role-directory-model";
describe("Mobile Faculty and Learner roster parity",()=>{
 it("uses a card list on small screens and retains a real table on desktop",()=>{
  const code=readFileSync("src/components/college/college-role-directory-workspace.tsx","utf8");
  expect(code).toMatch(/mobile records[^\n]+md:hidden/);
  expect(code).toContain('<div className="hidden md:block">');
  expect(code).toContain("<DataTable");
  expect(code).toContain("StudentClassMoveAction");
  expect(code).toContain("CollegeFacultyLifecycleAction");
  expect(code).toContain("collegeLearnerVerificationHref");
  expect(code).toContain("collegeRoleContactHref");
 });
 it("retains role-specific canonical deep links",()=>{
  expect(collegeRoleDirectoryHref("FACULTY",collegeRoleDirectoryQuerySchema.parse({q:"Ada"}))).toContain("/college/faculty?");
  expect(collegeRoleDirectoryHref("LEARNER",collegeRoleDirectoryQuerySchema.parse({q:"Ada"}))).toContain("/college/students?");
 });
});
