import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {tpoStudentJourneySteps} from "@/modules/placements/tpo-student-journey-strip-model";
import type {TpoStudentSummary} from "@/modules/placements/tpo-students-model";
import {toTpoRequestsPageCsv} from "@/modules/placements/tpo-requests-page-csv-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-12 TPO placement metrics and exporting",()=>{
 it("TPO-students-19 distinguishes all eligible students from students registered for placements",()=>{
  const s:TpoStudentSummary={activeLearners:20,placementPool:12,readyNotApplying:6,needsReadinessSupport:2,notRegistered:8,applying:4,placed:2,placedInPool:2,placedOutsidePool:0,readinessUnverified:true};
  expect(tpoStudentJourneySteps(s).map(x=>[x.label,x.count])).toEqual([
   ["In placements",20],["Registered",12],["Applying",4],["Placed",2]
  ]);
  expect(read("src/app/(authenticated)/tpo/students/page.tsx")).toContain("Journey of the {summary.activeLearners} students");
 });
 it("TPO-students-48 gives an announced count of visible students and selected rows",()=>{
  const page=read("src/app/(authenticated)/tpo/students/page.tsx");
  const spreadsheet=read("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(page).toContain('{roster.total} students in this view');
  expect(page).toContain('aria-live="polite"');
  expect(spreadsheet).toContain("selected of {shared?.totalCount??rows.length} in the authorized view");
  expect(read("src/components/tpo/tpo-students-selection.tsx")).toContain("selectedCount} selected of {totalCount}");
 });
 it("TPO-students-52 displays the student profile check, placement stage, outcome, readiness and offer facts",()=>{
  const panel=read("src/components/tpo/tpo-student-quick-panel.tsx");
  for(const label of ['"Profile check"','"Stage"','"Placements decision"','"Offers waiting on their answer"','"Prep %"'])expect(panel).toContain(label);
  expect(panel).toContain("afterCollegeDisplay(recordedOutcome)");
 });
 it("TPO-students-53 treats issued offers as released-awaiting-answer, accepted offers as offers, with a human label",()=>{
  const model=read("src/modules/placements/tpo-students-model.ts");
  expect(model).toContain('offersAwaitingAnswer=source.offers.filter(offer=>offer.status==="ISSUED").length');
  expect(model).toContain('offer.status === "ACCEPTED"');
  expect(read("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("Offers waiting on their answer");
 });
 it("TPO-requests-verification-15 exports the full capped authorized request view with reasons and guarded CSV data",()=>{
  const handler=read("src/app/api/placements/tpo/requests/export/route.ts");
  expect(handler).toContain("for(let page=2;page<=first.totalPages&&rows.length<cap;page++)");
  expect(handler).toContain('"X-Export-Truncated":String(truncated)');
  const csv=toTpoRequestsPageCsv([{id:"x",studentName:"=calc()",requestType:"ROUND_RESCHEDULE",status:"PENDING",jobTitle:"J",companyName:"C",requestedAt:new Date("2099-01-01T00:00:00Z"),reason:"Please change",decisionNote:null}]);
  expect(csv).toContain("What they asked");
  expect(csv).toContain("Please change");
  expect(csv).toContain("'=calc()");
 });
});
