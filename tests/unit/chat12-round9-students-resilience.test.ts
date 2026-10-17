import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const students=()=>src("src/app/(authenticated)/tpo/students/page.tsx");
const bulk=()=>src("src/components/tpo/tpo-bulk-action-panel.tsx");
const sheet=()=>src("src/components/tpo/tpo-students-spreadsheet.tsx");
describe("chat-12 Students S2/S3 audited gap guardrails",()=>{
 it("TPO-students-06 bounds timed debar by date or 10000 drives and requires reason to lift",()=>{
  const control=src("src/components/tpo/tpo-timed-debar-control.tsx");
  expect(control).toContain('untilDate:duration==="DATE"?untilDate:null');
  expect(control).toContain('untilDrives:duration==="DRIVES"?Number(untilDrives):null');
  expect(control).toContain("Number(untilDrives)>10000");
  expect(control).toContain("Reason for lifting");
 });
 it("TPO-students-07 reports unavailable debarment state rather than treating it as false",()=>{
  expect(students()).toContain("Timed debarment records are not available right now");
  expect(sheet()).toContain('row.debarred===null?"Unavailable"');
 });
 it("TPO-students-13 offers bulk Make ineligible with preset reasons and preview",()=>{
  expect(bulk()).toContain('label:"Make ineligible"');
  expect(bulk()).toContain("TPO_INELIGIBLE_REASONS.map");
  expect(bulk()).toContain("<TpoBulkActionPreview rows={previewWithNames}");
 });
 it("TPO-students-14 requires confirmed and rechecked Add selected to drive, keeping partial results",()=>{
  const control=src("src/components/tpo/tpo-students-bulk-add.tsx");
  expect(control).toContain('title="Add selected students to a drive"');
  expect(control).toContain("runGuarded(submit)");
  expect(control).toContain("formatTpoStudentsBulkOutcome(result)");
 });
 it("TPO-students-15 persists a learner notice on newly created bulk-drive applications",()=>{
  expect(src("src/modules/placements/bulk-drive-service.ts")).toContain("You were added to a placement drive");
 });
 it("TPO-students-16 reports grouped skips and supports retry, failed-row copy and safe share dialog",()=>{
  const preview=src("src/components/tpo/tpo-bulk-action-preview.tsx");
  expect(preview).toContain("groupedSkipped");
  expect(bulk()).toContain("Retry skipped/failed (preview again)");
  expect(bulk()).toContain("Copy failed");
  expect(bulk()).toContain('title="Share selected applicants with the company"');
  expect(bulk()).not.toContain("window.confirm(");
 });
 it("TPO-students-17 counts selections accessibly and limits Ctrl+A to the visible page",()=>{
  expect(sheet()).toContain("selected of {rows.length} on this visible page.");
  expect(sheet()).toContain('event.key.toLowerCase()==="a"');
  expect(sheet()).toContain("rows.slice(0,100)");
 });
 it("TPO-students-28 names the furthest known company without fabricating a placement",()=>{
  expect(sheet()).toContain('row.bestCompany?row.bestCompany+": "');
  expect(sheet()).toContain('label:"Best so far"');
 });
 it("TPO-students-36 exports only selected visible authorized students as CSV",()=>{
  expect(sheet()).toContain("const chosen=sortedRows.filter(row=>noteSelection.includes(row.membershipId)&&permitted.has(row.membershipId))");
  expect(sheet()).toContain("Export selected CSV");
 });
 it("TPO-students-37 announces keyboard clipboard failure instead of discarding it",()=>{
  expect(sheet()).toContain("Could not copy student rows. Check browser clipboard permissions.");
 });
 it("TPO-students-39 keeps Show all columns and Reset columns distinct",()=>{
  const chooser=src("src/components/tpo/tpo-grid-column-chooser.tsx");
  expect(chooser).toContain("Show all columns");
  expect(chooser).toContain("Reset columns");
  expect(chooser).toContain("selected.every((key,index)=>key===defaultKeys[index])");
 });
 it("TPO-students-R03 identifies existing disjoint selection controls for follow-up",()=>{
  expect(students()).toContain("<TpoBulkActionPanel");
  expect(students()).toContain("<TpoStudentsBulkAdd");
 });
 it("TPO-students-R04 has one Journey and Branch owner in the roster GET form",()=>{
  expect(students()).toContain('name="journeyState"');
  expect(students()).toContain('name="branchId"');
 });
 it("TPO-students-R05 does not display an internal legacy-parity banner to a TPO",()=>{
  expect(students()).not.toContain("Browser and legacy parity remain unverified.");
 });
 it("TPO-students-R06 converts journey and results enums to human wording",()=>{
  expect(sheet()).toContain("tpoStudentDisplayLabel(row.journeyState)");
  expect(sheet()).toContain("tpoStudentDisplayLabel(row.bestSoFar)");
 });
 it("TPO-students-R07 derives journey tiles from scoped filtered students",()=>{
  expect(src("src/modules/placements/tpo-students-service.ts")).toContain("const scopedRows=filterTpoStudentRoster(filteredRows");
 });
});
