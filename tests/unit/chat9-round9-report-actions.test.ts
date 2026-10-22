import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
import {tpoUnplacedStudentsHref} from "@/modules/placements/tpo-unplaced-students-link";
import {summarizeFailedRoundSharesByBranch} from "@/modules/placements/tpo-failure-round-share-model";
import {filterCompanyEngagement} from "@/modules/placements/tpo-company-engagement-filter-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 TPO report drilldowns and presentation",()=>{
 it("TPO-calendar-reports-44 sends authorized batch and branch to the Students subset with an honest scope disclaimer",()=>{
  const url=tpoUnplacedStudentsHref({batchId:"batch-one",branchId:"branch-two"});
  const query=new URL(url,"https://example.invalid").searchParams;
  expect(query.get("journeyState")).toBe("READY_NOT_APPLYING");
  expect(query.get("batchId")).toBe("batch-one");
  expect(query.get("branchId")).toBe("branch-two");
  expect(read("src/app/(authenticated)/tpo/reports/unplaced/page.tsx")).toContain("This does not prove that all learners have been placed across all seasons.");
 });
 it("TPO-calendar-reports-48 counts unique applied decisions by round and active branch rather than all registered candidates",()=>{
  const result=summarizeFailedRoundSharesByBranch([
   {id:"a",roundId:"r",roundName:"Interview",jobId:"j",outcome:"FAIL",branchId:"b",branchName:"CSE"},
   {id:"a",roundId:"r",roundName:"Interview",jobId:"j",outcome:"FAIL",branchId:"b",branchName:"CSE"},
   {id:"b",roundId:"r",roundName:"Interview",jobId:"j",outcome:"PASS",branchId:"b",branchName:"CSE"},
  ]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({decisions:2,failed:1,shareOfRoundPercent:50});
 });
 it("TPO-calendar-reports-49 does not infer recruiter outreach without recorded events or completed rounds",()=>{
  const model=read("src/modules/placements/tpo-company-engagement-model.ts");
  const service=read("src/modules/placements/tpo-engagement-ran-drives-service.ts");
  expect(model).toContain("if(lead.inviteSentAt)row.invited+=1");
  expect(model).toContain("if(lead.recruiterUserId)row.joined+=1");
  expect(service).toContain('eq(placementJobRounds.status,"COMPLETED")');
  expect(service).toContain("count(distinct");
  expect(filterCompanyEngagement([{companyId:"one"},{companyId:"two"}],"foreign")).toEqual({valid:false,rows:[]});
 });
 it("TPO-calendar-reports-50 scopes a maximum of 12 saved report views to browser user and college",()=>{
  const ui=read("src/components/placements/tpo-report-saved-filters.tsx");
  expect(ui).toContain('"lms.tpo.report-view."+collegeId+"."+userId+"."');
  expect(ui).toContain(".slice(0,12)");
  expect(ui).toContain("views.length>=12");
  expect(ui).toContain("localStorage.setItem");
 });
 it("TPO-calendar-reports-51 supports native fullscreen and a recoverable exit without a false success",()=>{
  const ui=read("src/components/placements/tpo-report-presentation.tsx");
  expect(ui).toContain("requestFullscreen()");
  expect(ui).toContain("document.exitFullscreen()");
  expect(ui).toContain("aria-pressed={active}");
  expect(ui).toContain("Presentation mode unavailable.");
 });
});
