import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=readFileSync("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx","utf8");
describe("TPO Drives latest prototype list",()=>{
 it("renders prototype operations table with five exact semantic columns",()=>{
  expect(src).toContain('data-testid="tpo.drives.prototype-list"');
  for(const h of ["Drive","Where it is","Next","Needs you","Who"]){
   expect(src).toContain(">"+h+"</th>");
  }
  expect(src).toContain('aria-label="Prototype drive operations table"');
  expect(src).toContain("data.rows.map(job=>");
 });
 it("surfaces actual authorized recruiter drive requests independently of the live drive page",()=>{
  expect(src).toContain('data-testid="tpo.drives.request-cards"');
  expect(src).toContain('getTpoDriveLifecycleList(context,{view:"REQUESTS",page:"1"})');
  expect(src).toContain('requestPreview.requestRows.filter(item=>item.reviewRequired).slice(0,2)');
  expect(src).toContain('href="/tpo/placements/lifecycle?view=REQUESTS&page=1"');
  expect(src).toContain("Recruiter access ended.");
  expect(src).toContain("Recruiter requests could not be loaded.");
 });
 it("uses recorded application, round and offer counts without inventing shortlists",()=>{
  expect(src).toContain("job.appliedCount");
  expect(src).toContain("job.roundsCompleted");
  expect(src).toContain("job.roundCount");
  expect(src).toContain("job.offersMade");
  expect(src).toContain("tpoDriveWhereItIs(job,data.asOf)");
  expect(src).toContain("job.nextRoundAt");
  expect(src).toContain('timeZone:"Asia/Kolkata"');
  expect(src).toContain("Counts are recorded application, round and offer facts, not inferred shortlist totals.");
 });
 it("preserves the real permission boundary, drilldown and original bulk export tools",()=>{
  expect(src).toContain('can(context,"placements.manage"');
  expect(src).toContain("getTpoDriveLifecycleList(context");
  expect(src).toContain('Advanced drive table, bulk actions and exports');
  expect(src).toContain("<TpoDriveActOnPanel");
  expect(src).toContain("<TpoBulkDriveDeadline");
  expect(src).toContain("<TpoRemindNonApplicants");
  expect(src).toContain('method="get" aria-label="Selected drive export"');
 });
 it("resolves needs-you actions to actual drive workflows, not pretend mutations",()=>{
  expect(src).toContain('href:href+"/extend-deadline"');
  expect(src).toContain('href:href+"/offers"');
  expect(src).toContain('href:href+"/rounds"');
  expect(src).toContain('job.status==="DRAFT"?{label:"Review draft",href}:null');
  expect(src).toContain("new Date(job.applicationDeadline).getTime()");
 });
});
