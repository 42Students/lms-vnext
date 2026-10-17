import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoStudentDisplayLabel} from "@/modules/placements/tpo-student-display-label";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Chat-12 TPO Students legacy wording",()=>{
 it("TPO-students-46 keeps the exact legacy header subtitle and a single import action",()=>{
  const page=read("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain("Everyone in placements, from the batches you made eligible.");
  expect(page).toContain("actions={manageAllowed?<TpoAcademicImportWorkspace />:undefined}");
  expect(page).toContain('aria-label="Student roster tools"');
 });
 it("TPO-students-47 restores roster search, empty and failure wording",()=>{
  const page=read("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain("<TpoDebouncedStudentSearch");
  expect(read("src/components/tpo/tpo-debounced-student-search.tsx")).toContain('placeholder="Search name, roll no., email"');
  expect(page).toContain("Nobody is in placements yet.");
  expect(page).toContain("Decide who is in on Placement eligibility; they show up here.");
  expect(read("src/app/(authenticated)/tpo/students/error.tsx")).toContain("Could not load students");
 });
 it("TPO-students-R05 removes internal builder status text from the student page",()=>{
  const page=read("src/app/(authenticated)/tpo/students/page.tsx");
  for(const copy of ["Browser and legacy parity remain unverified","Readiness unverified","registered in the database","not available in the registered database"]){expect(page).not.toContain(copy);}
 });
 it("TPO-students-R06 translates participation, journey, readiness and interview outcomes",()=>{
  expect(tpoStudentDisplayLabel("READY_NOT_APPLYING")).toBe("Ready, not applying");
  expect(tpoStudentDisplayLabel("PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT")).toBe("Academic details recorded");
  expect(tpoStudentDisplayLabel("INELIGIBLE")).toBe("Ineligible");
  expect(tpoStudentDisplayLabel("TECHNICAL INTERVIEW round 2: NOT_SELECTED")).toBe("Not selected at Technical interview (round 2)");
  expect(read("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("tpoStudentDisplayLabel(row.bestSoFar)");
 });
});
