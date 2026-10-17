import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {validLegacyProgramYears,deriveSuperAdminProgramCode} from "@/modules/admin-ui/super-admin-program-input";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-11 college academic page parity round five",()=>{
 it("COL-academic-setup-23 derives optional program code and preserves 1–10 integer year duration and editable department",()=>{
  expect(deriveSuperAdminProgramCode("Computer Science Engineering")).toBe("CSE");
  expect(validLegacyProgramYears("1")).toBe(true);
  expect(validLegacyProgramYears("10")).toBe(true);
  for(const invalid of ["0","0.5","11","3.5",""])expect(validLegacyProgramYears(invalid)).toBe(false);
  const list=read("src/components/admin/admin-program-directory.tsx");
  expect(list).toContain("Program code (optional)");
  expect(list).toContain("deriveSuperAdminProgramCode(name)");
  const edit=read("src/components/academics/academics-actions.tsx");
  expect(edit).toContain("setDepartmentId");
  expect(edit).toContain("durationTerms: displayDurationYears ? Number(durationTerms)*2");
 });
 it("COL-academic-setup-29 disables dependent batch removal with explicit student and class counts",()=>{
  const code=read("src/components/academics/college-cohort-management.tsx");
  expect(code).toContain("row.activeSections>0 || row.activeEnrolledLearners>0");
  expect(code).toContain("Move or remove its ${row.activeSections} classes and ${row.activeEnrolledLearners} students before deleting.");
  expect(read("src/components/academics/college-academic-directory.tsx")).toContain("Clear filters");
 });
 it("COL-academic-setup-32 launches a selected class schedule from its list row",()=>{
  expect(read("src/components/academics/college-structure-directory.tsx")).toContain('"/college/classes/recurring-preview?classId="');
  expect(read("src/app/(authenticated)/college/classes/recurring-preview/page.tsx")).toContain("defaultSectionId={classId}");
  const preview=read("src/components/academics/college-recurring-preview.tsx");
  expect(preview).toContain('useState(chosen?.id ?? "")');
  expect(preview).toContain('useState(chosen?.periodStart ?? "")');
  expect(preview).toContain('useState(chosen?.periodEnd ?? "")');
 });
 it("COL-academic-setup-39 uses Export CSV labels and keeps intentional capped server export",()=>{
  for(const name of ["classes","batches","semesters","lecture-halls"]){
   const code=read(`src/app/(authenticated)/college/${name}/page.tsx`);
   expect(code).toContain("Export CSV");
   expect(code).not.toContain("Export filtered ");
  }
  expect(read("src/modules/academics/college-academic-export-model.ts")).toContain("ACADEMIC_EXPORT_CAP=1000");
 });
});
