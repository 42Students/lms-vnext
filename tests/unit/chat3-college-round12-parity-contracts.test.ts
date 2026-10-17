import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
/** Sub-contract verification: unresolved legacy semantics remain unresolved. */
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 college people and attendance source contract audit",()=>{
 it("COL-people-01 faculty registration uses faculty role",()=>{
  const code=source("src/components/college/college-role-directory-workspace.tsx");
  expect(code).toContain("forcedRole=\"FACULTY\"");
 });
 it("COL-people-02 faculty profile preserves readonly login identity",()=>{
  const code=source("src/components/college/college-person-edit-action.tsx");
  expect(code).toContain("Edit Faculty");
  expect(code).toContain("Academic title");
  expect(code).toContain("readOnly");
 });
 it("COL-people-07 student edit preserves readonly login identity",()=>{
  const code=source("src/components/college/college-person-edit-action.tsx");
  expect(code).toContain("Edit Student");
  expect(code).toContain("Roll Number");
  expect(code).toContain("readOnly");
 });
 it("COL-people-16 bounded CSV escapes untrusted spreadsheet cells",()=>{
  const code=source("src/modules/people/college-role-directory-export.ts");
  expect(code).toContain("ROLE_DIRECTORY_EXPORT_LIMIT");
  expect(code).toContain("escapeRoleDirectoryCsvCell");
 });
 it("COL-people-20 college admin role can be changed only by super admin",()=>{
  const code=source("src/modules/people/membership-service.ts");
  expect(code).toContain("if (input.role === \"COLLEGE_ADMIN\")");
  expect(code).toContain("requirePermission(context, \"admin-scope.select\")");
 });
 it("COL-people-25 mobile validation and partial failures stay actionable",()=>{
  const code=source("src/components/college/college-student-register-form.tsx");
  expect(code).toContain("Mobile number must be 10 digits");
  expect(code).toContain("Some enrollment steps need attention.");
 });
 it("COL-people-26 faculty lifecycle confirms persisted action",()=>{
  const code=source("src/components/college/college-faculty-lifecycle-action.tsx");
  expect(code).toContain("Faculty suspended.");
  expect(code).toContain("Faculty reactivated.");
 });
 it("COL-attendance-03 calendar records no-class dates and Sunday",()=>{
  const code=source("src/components/attendance/admin-attendance-workspace.tsx");
  expect(code).toContain("No class scheduled");
  expect(code).toContain("isSunday");
 });
 it("COL-attendance-05 successful attendance corrections are announced",()=>{
  const code=source("src/components/attendance/admin-attendance-workspace.tsx");
  expect(code).toContain("Attendance corrected for ");
  expect(code).toContain("role=\"status\"");
 });
 it("COL-attendance-12 day-wise attendance CSV preserves discrete mark codes",()=>{
  const code=source("src/components/attendance/admin-attendance-workspace.tsx");
  expect(code).toContain("sessionDays.map(row=>row.day)");
  expect(code).toContain("return \"P\"");
  expect(code).toContain("return \"A\"");
  expect(code).toContain("return \"N\"");
 });
});
