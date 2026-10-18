import {describe,expect,it} from "vitest";
import {projectTpoInterviewReadiness,tpoInterviewWindowSchema} from "@/modules/placements/tpo-interview-readiness-model";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";
import {tpoLiveRoundVenueLabel} from "@/modules/placements/tpo-live-round-venue-model";
import {tpoLiveRoundJobHref} from "@/modules/placements/tpo-live-round-job-link-model";
import {filterTpoLiveRoundSearch,tpoLiveRoundSearchSchema} from "@/modules/placements/tpo-live-round-search-model";
import {projectTpoRoundFacts} from "@/modules/placements/tpo-round-facts-model";
import {buildTpoRoundDriveDayRoster} from "@/modules/placements/tpo-round-drive-day-model";
import {projectTpoRoundResultTable,filterTpoRoundResultRows,tpoRoundResultViewSchema} from "@/modules/placements/tpo-round-result-table-model";
import {summarizeFailedRoundShares,summarizeFailedRoundSharesByBranch} from "@/modules/placements/tpo-failure-round-share-model";
import {tpoRoundFailureCsv} from "@/modules/placements/tpo-round-failure-csv-model";

const now="2026-10-20T04:00:00Z";
const base={id:"r1",jobId:"j1",jobTitle:"Engineer",companyName:"Acme",name:"Panel",kind:"INTERVIEW",status:"SCHEDULED",mode:"ON_CAMPUS",venue:"Hall",scheduledAt:"2026-10-20T04:30:00Z",durationMinutes:30};
const round={id:"r",name:"Technical",status:"COMPLETED",sequence:1,mode:"ON_CAMPUS",scheduledAt:null,resultsDueAt:null,venue:"Hall",meetingUrl:null,platform:null,testUrl:null,durationMinutes:30,whatToBring:null,participants:[{result:{status:"STAGED"}},{result:{status:"APPLIED"}},{result:null}]};
const application=(id:string)=>({applicationId:id,student:"Learner "+id,role:"Engineer",applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",resultId:null,resultStatus:null,outcome:null});
describe("TPO-drive-workspace-44 live interview, Drive Day and result-read model ledger",()=>{
 it("returns only interview rounds; separates upcoming, happening now, unscheduled and unknown durations",()=>{
  const rows=[
    {...base},
    {...base,id:"r2",scheduledAt:"2026-10-20T03:50:00Z"},
    {...base,id:"r3",scheduledAt:null},
    {...base,id:"r4",durationMinutes:null},
    {...base,id:"r5",kind:"TALK"},
  ];
  const projection=projectTpoInterviewReadiness(rows,now,14);
  expect(projection.counts).toEqual({upcoming:1,happeningNow:1,pendingSchedule:1,durationUnknown:1,startedEarlier:0});
  expect(projection.rows).toHaveLength(4);
 });
 it("rejects readiness windows outside supported 1–90 day bounds",()=>{
  expect(tpoInterviewWindowSchema.safeParse({days:"14"}).success).toBe(true);
  expect(tpoInterviewWindowSchema.safeParse({days:0}).success).toBe(false);
  expect(tpoInterviewWindowSchema.safeParse({days:91}).success).toBe(false);
  expect(()=>projectTpoInterviewReadiness([],now,0)).toThrow("Invalid interview window");
 });
 it("gives neutral countdown before start, precise elapsed and nonnegative remaining after end",()=>{
  const slot={scheduledAt:"2026-10-20T04:00:00Z",durationMinutes:30};
  expect(tpoLiveRoundTiming(slot,"2026-10-20T03:59:00Z")).toEqual({elapsedMinutes:null,remainingMinutes:null});
  expect(tpoLiveRoundTiming(slot,"2026-10-20T04:10:30Z")).toEqual({elapsedMinutes:10,remainingMinutes:20});
  expect(tpoLiveRoundTiming(slot,"2026-10-20T05:10:00Z")).toEqual({elapsedMinutes:70,remainingMinutes:0});
  expect(tpoLiveRoundTiming({...slot,durationMinutes:null},now)).toEqual({elapsedMinutes:null,remainingMinutes:null});
 });
 it("labels missing venue instead of inventing one, and URL-escapes job IDs",()=>{
  expect(tpoLiveRoundVenueLabel(null)).toBe("Venue not recorded");
  expect(tpoLiveRoundVenueLabel("  Hall A  ")).toBe("Recorded venue: Hall A");
  expect(tpoLiveRoundJobHref("job/a")).toBe("/tpo/placements/jobs/job%2Fa");
 });
 it("filters live rounds across company role and round name with casefolding and no mutation",()=>{
  const rows=[{companyName:"Acme",jobTitle:"Engineer",name:"HR round"},{companyName:"Bluebird",jobTitle:"Analyst",name:"Coding"}];
  expect(filterTpoLiveRoundSearch(rows,"  ACME ")).toEqual([rows[0]]);
  expect(filterTpoLiveRoundSearch(rows,"coding")).toEqual([rows[1]]);
  expect(filterTpoLiveRoundSearch(rows,"")).toEqual(rows);
  expect(tpoLiveRoundSearchSchema.safeParse("x".repeat(101)).success).toBe(false);
 });
 it("projects legacy round labels, IST fallback and staged results without pretending they were applied",()=>{
  const p=projectTpoRoundFacts(round);
  expect(p.status).toBe("Done");
  expect(p.when).toBe("Date to be decided");
  expect(p.results).toBe("1 waiting to apply");
  expect(p.students).toBe(3);
  expect(p.place).toBe("Hall");
  expect(projectTpoRoundFacts({...round,participants:[{result:{status:"APPLIED"}}],mode:"VIRTUAL",meetingUrl:null}).place).toBe("Meeting link to be told");
 });
 it("drops details-only records and roster entries without scoped application matches",()=>{
  const roster=[
    {applicationId:"a",displayName:"Ada",rollNumber:null,attendance:"PRESENT"},
    {applicationId:"missing",displayName:"Leak",rollNumber:null,attendance:"PRESENT"},
    {applicationId:"b",displayName:"Bob",rollNumber:null,attendance:"bad-input"},
  ];
  const details=[
    {applicationId:"a",applicationStatus:"SUBMITTED",resultStatus:"STAGED",resultOutcome:"PASS"},
    {applicationId:"b",applicationStatus:"SUBMITTED",resultStatus:null,resultOutcome:"FAIL"},
    {applicationId:"out-of-roster",applicationStatus:"SUBMITTED",resultStatus:"APPLIED",resultOutcome:"PASS"},
  ];
  const p=buildTpoRoundDriveDayRoster(roster,details);
  expect(p.rows.map(r=>r.applicationId)).toEqual(["a","b"]);
  expect(p.rows[1]?.attendance).toBe("UNKNOWN");
  expect(p.rows[1]?.resultOutcome).toBeNull();
  expect(p.counts).toMatchObject({total:2,present:1,unknownAttendance:1,stagedResults:1,appliedResults:0,noResult:1});
 });
 it("result read model filters ineligible application facts and applied rows are immutable",()=>{
  const rows=[application("a"),{...application("b"),resultId:"r2",resultStatus:"APPLIED",outcome:"PASS"},{...application("c"),screeningStatus:"REJECTED"}];
  const p=projectTpoRoundResultTable(rows,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"PUBLISHED"});
  expect(p.rows.map(x=>x.applicationId)).toEqual(["a","b"]);
  expect(p.rows.map(x=>x.editable)).toEqual([true,false]);
  expect(p.counts).toEqual({eligible:2,staged:0,applied:1,remaining:1});
  expect(projectTpoRoundResultTable(rows,{kind:"TALK",status:"COMPLETED",jobStatus:"PUBLISHED"}).rows.every(x=>!x.editable)).toBe(true);
 });
 it("filters result review by status and case-insensitive name or role",()=>{
  const rows=[{student:"Ada",role:"Tester",resultStatus:"STAGED"},{student:"Bob",role:"Developer",resultStatus:null}];
  expect(filterTpoRoundResultRows(rows,{q:"dev",status:"NOT_RECORDED"})).toEqual([rows[1]]);
  expect(filterTpoRoundResultRows(rows,{q:"ada",status:"APPLIED"})).toEqual([]);
  expect(tpoRoundResultViewSchema.safeParse({status:"GARBAGE"}).success).toBe(false);
 });
 it("uses applied-result denominator, deduplicates events and separates branches",()=>{
  const input=[
    {id:"e1",roundId:"r",roundName:"Technical",jobId:"j",outcome:"FAIL"},
    {id:"e1",roundId:"r",roundName:"Technical",jobId:"j",outcome:"FAIL"},
    {id:"e2",roundId:"r",roundName:"Technical",jobId:"j",outcome:"PASS"},
  ];
  expect(summarizeFailedRoundShares(input)).toMatchObject([{decisions:2,failed:1,shareOfRoundPercent:50}]);
  const byBranch=summarizeFailedRoundSharesByBranch([
    {...input[0]!,branchId:"c1",branchName:"CSE"},
    {...input[2]!,branchId:null,branchName:null},
  ]);
  expect(byBranch).toHaveLength(2);
  expect(byBranch.find(r=>r.branchId===null)?.branchName).toBe("Not recorded");
 });
 it("exports failure share using the same denominator while defusing CSV formulas",()=>{
  const csv=tpoRoundFailureCsv([{roundName:"=hack",branchName:"CSE",failed:1,decisions:2,shareOfRoundPercent:50}]);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"\'=hack"');
  expect(csv).toContain('"50%"');
  expect(csv).toContain("Applied decisions");
 });
});
