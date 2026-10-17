import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO Students FIXED-ON-MAIN source verification; runtime not yet certified",()=>{
 it("TPO-students-33 preserves its audited source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("<TpoAcademicImportWorkspace");
  expect(source("src/modules/placements/tpo-academic-import-service.ts")).toContain("ACADEMIC_RECORD_IMPORTED");
 });
 it("TPO-students-08 preserves its audited source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("TpoRosterVerificationBulk");
 });
 it("TPO-students-09 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-roster-verification-bulk.tsx")).toContain("SEND_BACK");
 });
 it("TPO-students-11 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-student-note-editor.tsx")).toContain("Ctrl+Enter to save");
  expect(source("src/modules/placements/tpo-student-notes-service.ts")).toContain("NOTE_ADDED");
 });
 it("TPO-students-18 preserves its audited source contract",()=>{
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("batchId: uuid.optional()");
  expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("name=\"programId\"");
 });
 it("TPO-students-19 preserves its audited source contract",()=>{
  expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("Student placement journey");
 });
 it("TPO-students-20 preserves its audited source contract",()=>{
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("legacyStage:z.enum([\"ELIGIBLE\"");
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("profileStatus:z.enum");
 });
 it("TPO-students-21 preserves its audited source contract",()=>{
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("minTenthPct");
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("minUgPct");
 });
 it("TPO-students-23 preserves its audited source contract",()=>{
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("minApplications");
  expect(source("src/modules/placements/tpo-students-service.ts")).toContain("interviewedWith");
 });
 it("TPO-students-26 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("label:\"Stage\"");
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("label:\"Gender\"");
 });
 it("TPO-students-30 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-student-quick-panel.tsx")).toContain("\"Profile check\"");
  expect(source("src/modules/placements/tpo-student-verification-facts.ts")).toContain("waitingSections");
 });
 it("TPO-students-35 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-student-saved-views.tsx")).toContain("Saved student views");
  expect(source("src/modules/placements/tpo-student-saved-views-service.ts")).toContain("eq(placementTpoSavedViews.scope,\"STUDENTS\")");
 });
 it("TPO-students-54 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-student-outcome-pill.tsx")).toContain("AFTER_COLLEGE_LABELS");
 });
 it("TPO-students-27 preserves its audited source contract",()=>{
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("row.programName+\" · \"+row.cohortName");
  expect(source("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("row.fromFinishedBatch?\" · From \"");
 });
});
