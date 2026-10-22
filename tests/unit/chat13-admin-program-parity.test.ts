import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {deriveSuperAdminProgramCode,validLegacyProgramYears} from "@/modules/admin-ui/super-admin-program-input";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin program input and copy",()=>{
 it("SA-academics-people-13 uses legacy program headings, hints and success wording",()=>{
  const source=read("src/components/admin/admin-program-directory.tsx");
  for(const label of ["Create New Program","Existing Programs","Program Name","Duration (Years)",
   "Go to Departments","Created program “"])expect(source).toContain(label);
 });
 it("SA-academics-people-43 constrains Super Admin duration to whole 1–10 years",()=>{
  for(const n of ["1","4","10"])expect(validLegacyProgramYears(n)).toBe(true);
  for(const n of ["","0","0.5","10.5","11","-2","Infinity"])expect(validLegacyProgramYears(n)).toBe(false);
  const source=read("src/components/admin/admin-program-directory.tsx");
  expect(source).toContain("validLegacyProgramYears(durationYears)");
  expect(source).toContain("min={1} max={10} step={1}");
 });
 it("SA-academics-people-44 derives the required internal code without asking for a mandatory legacy field",()=>{
  expect(deriveSuperAdminProgramCode("Computer Science Engineering")).toBe("CSE");
  expect(deriveSuperAdminProgramCode("Civil")).toBe("CIVIL");
  expect(deriveSuperAdminProgramCode("")).toBe("");
  const source=read("src/components/admin/admin-program-directory.tsx");
  expect(source).toContain("code.trim()||availableSuperAdminProgramCode(name,departmentId,programs)");
  expect(source).toContain("code:resolvedCode");
  expect(source).toContain("Program code (optional)");
  expect(source).not.toContain('id="admin-program-code" value={code} maxLength={64} required');
 });
});
