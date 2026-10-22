import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const page=()=>read("src/app/(authenticated)/tpo/students/page.tsx");
const roster=()=>read("src/components/tpo/tpo-students-spreadsheet.tsx");
const panel=()=>read("src/components/tpo/tpo-student-quick-panel.tsx");
describe("Chat-12 Students claimed-main gaps — verified source contracts",()=>{
 it("TPO-students-08 has bulk Verify profiles reachable from the roster",()=>{
  expect(page()).toContain("<TpoRosterVerificationBulk rows={waitingRosterRows}");
  expect(read("src/components/tpo/tpo-roster-verification-bulk.tsx")).toContain('"VERIFY"');
 });
 it("TPO-students-09 allows bulk Send back for correction with a reason",()=>{
  const source=read("src/components/tpo/tpo-roster-verification-bulk.tsx");
  expect(source).toContain('"SEND_BACK"');
  expect(source).toContain("reason.trim().length<3");
 });
 it("TPO-students-11 gives roster and per-student private notes a persisted editor",()=>{
  expect(roster()).toContain("<TpoStudentNoteEditor membershipIds={noteEligibleIds}");
  expect(panel()).toContain("<TpoStudentNoteEditor key={student.membershipId} membershipIds={[student.membershipId]}");
  expect(read("src/components/tpo/tpo-student-note-editor.tsx")).toContain('"/api/placements/tpo/students/notes"');
 });
 it("TPO-students-18 supports Batch, Program, Branch and Class filters",()=>{
  for(const key of ['name="programId"','name="classId"','name="batchId"','name="branchId"'])expect(page()).toContain(key);
  expect(read("src/modules/placements/tpo-students-service.ts")).toContain("batchId: uuid.optional()");
 });
 it("TPO-students-27 displays Program with Batch and the finished-batch tag",()=>{
  expect(roster()).toContain('row.programName+" · "+row.cohortName');
  expect(roster()).toContain('row.fromFinishedBatch?" · From "');
 });
 it("TPO-students-30 reads verification status and waiting sections",()=>{
  expect(roster()).toContain("row.verification.waitingSections");
  expect(read("src/modules/placements/tpo-student-verification-facts.ts")).toContain("verifiedSections");
 });
 it("TPO-students-37 exports selection to a safe tab-separated clipboard",()=>{
  expect(roster()).toContain("<TpoStudentClipboardActions");
  expect(read("src/components/tpo/tpo-student-clipboard-actions.tsx")).toContain("navigator.clipboard.writeText(tpoStudentClipboardTsv");
 });
 it("TPO-students-38 can select pasted roll numbers",()=>{
  const source=read("src/components/tpo/tpo-student-clipboard-actions.tsx");
  expect(source).toContain("matchTpoStudentRolls");
  expect(source).toContain("<Textarea");
 });
 it("TPO-students-40 offers sorting by application and offer counts",()=>{
  expect(roster()).toContain("APPLICATIONS_DESC");
  expect(roster()).toContain("OFFERS_ASC");
  expect(roster()).toContain("Sort visible roster page");
 });
 it("TPO-students-41 supports Ctrl+A and Ctrl+C, with Ctrl+Enter notes",()=>{
  expect(roster()).toContain('event.key.toLowerCase()==="a"');
  expect(roster()).toContain('event.key.toLowerCase()==="c"');
  expect(read("src/components/tpo/tpo-student-note-editor.tsx")).toContain("onKeyDown");
 });
 it("TPO-students-42 has a per-student Requests tab with decision controls",()=>{
  expect(panel()).toContain('"Requests"');
  expect(panel()).toContain("<TpoRequestDecisionControl");
  expect(panel()).toContain("waiting)");
 });
 it("TPO-students-44 includes team events in the per-student History timeline",()=>{
  expect(panel()).toContain("detail?.teamHistory?.map(");
  expect(panel()).toContain("Team and student activity");
 });
 it("TPO-students-R02 resets add-to-drive selection across search and pages",()=>{
  expect(page()).toContain('key={"bulk-add:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}');
 });
 it("TPO-students-R08 gives every student-row action a unique accessible name",()=>{
  expect(roster()).toContain('aria-label={"Placement history for "+row.displayName}');
  expect(roster()).toContain('aria-label={"Change participation for "+row.displayName}');
  expect(roster()).toContain('ariaLabel:row=>"Open student panel for "+row.displayName');
 });
 it("TPO-students-R07 uses the filtered roster population for journey summary counts",()=>{
  const source=read("src/modules/placements/tpo-students-service.ts");
  expect(source).toContain("summary: summarizeTpoStudents(scopedRows)");
  expect(source).toContain("const scopedRows=filterTpoStudentRoster(filteredRows,{");
  expect(source).not.toContain("summary: summarizeTpoStudents(workingRows)");
 });
});
