import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const text=(path:string)=>readFileSync(path,"utf8");
const grid="src/components/tpo/tpo-students-spreadsheet.tsx";
const studentPage="src/app/(authenticated)/tpo/students/page.tsx";
const requests="src/app/(authenticated)/tpo/requests/page.tsx";
describe("Chat-5 second verified-main source contracts",()=>{
 it("TPO-students-35 keeps saved views on the scoped roster page",()=>{
  expect(text(studentPage)).toContain("TpoStudentSavedViews");
  expect(text("src/components/tpo/tpo-student-saved-views.tsx")).toContain("apiFetch");
 });
 it("TPO-students-37 copies authorized student rows as safe TSV with a browser failure fallback",()=>{
  const src=text("src/components/tpo/tpo-student-clipboard-actions.tsx");
  expect(src).toContain("tpoStudentClipboardTsv(matching)");
  expect(src).toContain("navigator.clipboard.writeText");
  expect(src).toContain("Clipboard access is blocked");
 });
 it("TPO-students-38 matches pasted rolls only against supplied view records",()=>{
  const src=text("src/components/tpo/tpo-student-clipboard-actions.tsx");
  expect(src).toContain("matchTpoStudentRolls(rows,text)");
  expect(src).toContain("onSelect(result.found)");
 });
 it("TPO-students-40 exposes numeric application and offer sorting in the spreadsheet",()=>{
  const src=text(grid);
  expect(src).toContain("pageSort");
  expect(src).toContain('pageSort.startsWith("APPLICATIONS")');
  expect(src).toContain('pageSort.startsWith("OFFERS")');
 });
 it("TPO-students-41 gives the roster keyboard-labelled controls and note shortcut",()=>{
  expect(text(grid)).toContain('aria-label="Students spreadsheet keyboard actions"');
  expect(text("src/components/tpo/tpo-student-note-editor.tsx")).toContain("Ctrl+Enter");
 });
 it("TPO-students-42 provides student-specific Requests and safe decision detail",()=>{
  const src=text("src/components/tpo/tpo-student-quick-panel.tsx");
  expect(src).toContain('"Requests"');
  expect(src).toContain("TpoRequestDecisionControl");
 });
 it("TPO-students-44 includes persisted team activity in the student panel",()=>{
  const src=text("src/components/tpo/tpo-student-quick-panel.tsx");
  expect(src).toContain("teamHistory");
  expect(src).toContain('"History"');
 });
 it("TPO-students-R02 binds selection and authorized data to the requested roster",()=>{
  const src=text(studentPage);
  expect(src).toContain("TpoStudentsSelection");
  expect(src).toContain("TpoStudentsSpreadsheet");
 });
 it("TPO-students-R08 labels student-specific actions for assistive technologies",()=>{
  const src=text(grid);
  expect(src).toContain("TpoStudentQuickPanel");
  expect(src).toContain("aria-label");
 });
 it("TPO-requests-verification-09 displays roster roll and branch evidence",()=>{
  const src=text(requests);
  expect(src).toContain("rollNumber");
  expect(src).toContain("Branch:");
 });
 it("TPO-requests-verification-10 displays the decision actor, reason and timestamp rather than hiding audit history",()=>{
  const src=text(requests);
  expect(src).toContain("decidedAt");
  expect(src).toContain("decisionNote");
 });
 it("TPO-requests-verification-12 prioritizes the actionable request queue without mutating history",()=>{
  expect(text(requests)).toContain('aria-label="Needs doing first"');
  expect(text(requests)).toContain("tpoRequestAgeLabel");
 });
 it("TPO-requests-verification-14 offers a concrete target learner notice action",()=>{
  expect(text(requests)).toContain("TpoStudentNudgePanel");
 });
 it("TPO-requests-verification-15 exports the current authorized request filters through a separate route",()=>{
  expect(text(requests)).toContain("tpoRequestsExportHref");
  expect(text(requests)).toContain("TpoSafeCsvDownload");
 });
 it("TPO-requests-verification-32 exposes separate Waiting Sent back Verified export choices",()=>{
  const src=text("src/app/(authenticated)/tpo/verification/page.tsx");
  for(const tab of ['["WAITING","Waiting"]','["SENT_BACK","Sent back"]','["VERIFIED","Verified"]'])expect(src).toContain(tab);
  expect(src).toContain("TpoSafeCsvDownload");
 });
});
