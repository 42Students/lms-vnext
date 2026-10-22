import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("G2-2-010-004 legacy College Admin attendance policy",()=>{
 it("keeps the College Admin card read-only with an explicit Reload control",()=>{
  const page=source("src/app/(authenticated)/college/attendance/settings/page.tsx");
  const form=source("src/components/attendance/college-attendance-policy-form.tsx");
  expect(page).toContain("readOnly={!isSuperAdmin(context)}");
  expect(form).toContain('aria-label="Reload attendance policy"');
  expect(form).toContain('These attendance policy fields are read-only for College Admin.');
  expect(form).toContain("if (readOnly)");
 });
 it("does not let a direct mutation endpoint bypass that actor restriction",()=>{
  const service=source("src/modules/attendance/policy-service.ts");
  expect(service).toContain('if(!isSuperAdmin(context))throw new AuthorizationError("academics.manage")');
  for(const name of ["updateCollegeAttendancePolicy","updateCollegeAttendancePolicyField","resetCollegeAttendancePolicyOverride"]){
   const declaration=service.indexOf("export async function "+name+"(");
   expect(declaration).toBeGreaterThan(0);
   expect(service.slice(declaration,declaration+235)).toContain("requirePolicyWriteActor(context)");
  }
 });
});
