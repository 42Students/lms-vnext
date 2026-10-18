import {describe,expect,it} from "vitest";
import {roundApplyPreviewCsv,roundApplyReportCsv} from "@/modules/placements/tpo-round-apply-csv-model";
import {summarizeFailedRoundShares,summarizeFailedRoundSharesByBranch} from "@/modules/placements/tpo-failure-round-share-model";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";
import {tpoLiveRoundVenueLabel} from "@/modules/placements/tpo-live-round-venue-model";
import {tpoLiveRoundJobHref} from "@/modules/placements/tpo-live-round-job-link-model";
import {filterTpoLiveRoundSearch,tpoLiveRoundSearchSchema} from "@/modules/placements/tpo-live-round-search-model";
import {tpoRoundResultEntryFormSchema} from "@/modules/placements/tpo-round-result-entry-model";
import {canEditTpoRoundResult,canApplyTpoRoundResult} from "@/modules/placements/tpo-confirmed-round-result-model";
const id="00000000-0000-4000-8000-000000000001";

describe("TPO-BREAK-round-03 reports, live interviews and strict result input",()=>{
 it("does not inflate failure ratios from repeated applied rows or include unrecorded learners",()=>{
  const data=[
   {id:"r1",roundId:"a",roundName:"Screen",jobId:"job",outcome:"FAIL"},
   {id:"r1",roundId:"a",roundName:"Screen",jobId:"job",outcome:"FAIL"},
   {id:"r2",roundId:"a",roundName:"Screen",jobId:"job",outcome:"PASS"},
   {id:"r3",roundId:"b",roundName:"Interview",jobId:"job",outcome:"HOLD"},
  ];
  const summary=summarizeFailedRoundShares(data);
  expect(summary.find(x=>x.roundId==="a")).toMatchObject({decisions:2,failed:1,shareOfRoundPercent:50});
  expect(summary.find(x=>x.roundId==="b")).toMatchObject({decisions:1,failed:0,shareOfRoundPercent:0});
  const branches=summarizeFailedRoundSharesByBranch(data.map((item,i)=>({
   ...item,branchId:i===3?null:"branch",branchName:i===3?null:"Engineering",
  })));
  expect(branches).toHaveLength(2);
  expect(branches.find(x=>x.roundId==="b")).toMatchObject({branchName:"Not recorded",decisions:1});
 });
 it("round preview/report CSV neutralizes formula cells and escapes embedded quotes",()=>{
  const preview=roundApplyPreviewCsv([{student:' =HYPERLINK("https://evil.test")',
   outcome:"FAIL",destination:'"external", desk',status:"STAGED"}]);
  expect(preview).toContain("\"' =HYPERLINK");
  expect(preview).toContain('\"\"external\"\", desk\"');
  expect(preview).toContain("\"FAIL\",\"");
  const report=roundApplyReportCsv([{student:"+ADMIN",outcome:"PASS",status:"applied",reason:""}]);
  expect(report).toContain("\"'+ADMIN\"");
  expect(report).toContain("\"applied\"");
  expect(report.endsWith("\r\n")).toBe(true);
 });
 it("live timing fails closed for missing or invalid durations and never exposes a fake countdown",()=>{
  const start="2026-10-20T04:00:00.000Z",current="2026-10-20T04:12:00.000Z";
  expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:30},current))
   .toEqual({elapsedMinutes:12,remainingMinutes:18});
  expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:30},"2026-10-20T03:00:00Z"))
   .toEqual({elapsedMinutes:null,remainingMinutes:null});
  for(const durationMinutes of [null,0,-1,Number.NaN,Number.POSITIVE_INFINITY,0.5]){
   expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes},current))
    .toEqual({elapsedMinutes:null,remainingMinutes:null});
  }
  expect(tpoLiveRoundTiming({scheduledAt:"invalid",durationMinutes:30},current).remainingMinutes).toBeNull();
 });
 it("encodes links and labels missing interview rooms without fabricating a location",()=>{
  expect(tpoLiveRoundJobHref("abc/other?x=1")).toBe("/tpo/placements/jobs/abc%2Fother%3Fx%3D1");
  expect(tpoLiveRoundVenueLabel(null)).toBe("Venue not recorded");
  expect(tpoLiveRoundVenueLabel("  Hall A  ")).toBe("Recorded venue: Hall A");
 });
 it("matches company, job and round by case-folded search but never increases a roster",()=>{
  const list=[{companyName:"Alpha",jobTitle:"Research",name:"Interview"},
   {companyName:"Beta",jobTitle:"Development",name:"Campus screening"}];
  expect(filterTpoLiveRoundSearch(list,"  alPHA ").map(x=>x.companyName)).toEqual(["Alpha"]);
  expect(filterTpoLiveRoundSearch(list,"screening").map(x=>x.companyName)).toEqual(["Beta"]);
  expect(filterTpoLiveRoundSearch(list,"")).toEqual(list);
  expect(tpoLiveRoundSearchSchema.safeParse("x".repeat(101)).success).toBe(false);
 });
 it("requires version-aware confirmed learner results and explicit positive waitlist rank",()=>{
  const base={applicationId:id,expectedCurrentResultId:null,outcome:"FAIL",
   note:"Not shortlisted after review",waitlistRank:""};
  const fail=tpoRoundResultEntryFormSchema.safeParse(base);
  expect(fail.success).toBe(true);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,note:" "}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:"1"}).success).toBe(true);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:""}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:"1.5"}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:"1e2"}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:"0x10"}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"PASS",waitlistRank:"1"}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,unexpectedTenant:id}).success).toBe(false);
  expect(canEditTpoRoundResult({kind:"INTERVIEW",status:"SCHEDULED"},{resultStatus:"APPLIED"})).toBe(false);
  expect(canApplyTpoRoundResult({kind:"INTERVIEW",status:"COMPLETED"},{resultStatus:"STAGED"})).toBe(true);
  expect(canApplyTpoRoundResult({kind:"TALK",status:"COMPLETED"},{resultStatus:"STAGED"})).toBe(false);
 });
});
