import {describe,expect,it} from "vitest";
import {projectTpoInterviewReadiness,tpoInterviewWindowSchema,type InterviewRoundFact}
 from "@/modules/placements/tpo-interview-readiness-model";
import {projectTpoRoundFacts,type TpoRoundFactInput} from "@/modules/placements/tpo-round-facts-model";
import {buildTpoRoundDriveDayRoster} from "@/modules/placements/tpo-round-drive-day-model";
import {resolveBulkRoundLearnerTokens,summarizeBulkRoundResults} from "@/modules/placements/tpo-bulk-round-result-model";
import {projectTpoRoundResultTable,tpoRoundResultViewSchema,filterTpoRoundResultRows}
 from "@/modules/placements/tpo-round-result-table-model";
import {tpoRoundFailureCsv} from "@/modules/placements/tpo-round-failure-csv-model";
const uuid="00000000-0000-4000-8000-000000000001",other="00000000-0000-4000-8000-000000000002";
const date="2026-10-20T04:00:00.000Z";
const interview=(patch:Partial<InterviewRoundFact>):InterviewRoundFact=>({
 id:uuid,jobId:other,jobTitle:"Engineering",companyName:"Employer",name:"Interview",
 kind:"INTERVIEW",status:"SCHEDULED",mode:"ON_CAMPUS",venue:"Hall A",
 scheduledAt:date,durationMinutes:30,...patch,
});
const round=(patch:Partial<TpoRoundFactInput>):TpoRoundFactInput=>({
 id:uuid,name:"Interview",status:"SCHEDULED",sequence:1,mode:"ON_CAMPUS",
 scheduledAt:date,resultsDueAt:null,venue:" Hall A ",meetingUrl:null,platform:null,
 testUrl:null,durationMinutes:30,whatToBring:null,participants:[],...patch,
});
describe("TPO-BREAK-round-model-02 invalid input, permission-safe roster and result truth",()=>{
 it("rejects malformed interview windows before rendering and ignores cancelled interviews",()=>{
  expect(tpoInterviewWindowSchema.safeParse({days:90}).success).toBe(true);
  expect(tpoInterviewWindowSchema.safeParse({days:91}).success).toBe(false);
  expect(tpoInterviewWindowSchema.safeParse({days:0}).success).toBe(false);
  for(const d of [0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,91])
   expect(()=>projectTpoInterviewReadiness([],date,d)).toThrow("Invalid interview window");
  expect(()=>projectTpoInterviewReadiness([],"invalid",7)).toThrow("Invalid interview window");
  const state=projectTpoInterviewReadiness([
   interview({id:"cancelled",status:"CANCELLED"}),
   interview({id:"talk",kind:"TALK"}),
   interview({id:"active",scheduledAt:"2026-10-20T03:50:00Z",durationMinutes:30}),
   interview({id:"future",scheduledAt:"2026-10-20T06:00:00Z"}),
   interview({id:"pending",status:"PENDING",scheduledAt:null}),
   interview({id:"unknown",durationMinutes:Number.NaN}),
   interview({id:"old",scheduledAt:"2026-10-19T04:00:00Z"}),
  ],date,7);
  expect(state.rows.map(x=>x.id)).not.toContain("cancelled");
  expect(state.rows.map(x=>x.id)).not.toContain("talk");
  expect(Object.fromEntries(state.rows.map(x=>[x.id,x.state]))).toMatchObject({
   active:"HAPPENING_NOW",future:"UPCOMING",pending:"UNSCHEDULED",
   unknown:"DURATION_UNKNOWN",old:"START_PASSED",
  });
  expect(state.counts).toMatchObject({upcoming:1,happeningNow:1,pendingSchedule:1,durationUnknown:1,startedEarlier:1});
 });
 it("only renders owned round status labels and never inherited JavaScript properties",()=>{
  expect(projectTpoRoundFacts(round({status:"COMPLETED"})).status).toBe("Done");
  expect(projectTpoRoundFacts(round({status:"constructor"})).status).toBe("Not run yet");
  expect(projectTpoRoundFacts(round({status:"toString"})).status).toBe("Not run yet");
  const row=projectTpoRoundFacts(round({participants:[
   {result:{status:"STAGED"}},{result:{status:"APPLIED"}},{result:null}],
   scheduledAt:null,venue:" ",whatToBring:"Laptop",
  }));
  expect(row).toMatchObject({status:"Scheduled",when:"Date to be decided",
   place:"Venue to be told",students:3,results:"1 waiting to apply",bring:"Laptop"});
 });
 it("does not invent Drive Day students from another college's application details",()=>{
  const state=buildTpoRoundDriveDayRoster([
   {applicationId:uuid,displayName:"Zara",rollNumber:"20",attendance:"IN_INTERVIEW"},
   {applicationId:other,displayName:"Ada",rollNumber:"10",attendance:"FORGED"},
   {applicationId:"unknown",displayName:"Outsider",rollNumber:null,attendance:"PRESENT"},
  ],[
   {applicationId:uuid,applicationStatus:"SUBMITTED",resultStatus:"STAGED",resultOutcome:"HOLD"},
   {applicationId:other,applicationStatus:"SUBMITTED",resultStatus:null,resultOutcome:"PASS"},
   {applicationId:"detail-only",applicationStatus:"SUBMITTED",resultStatus:"APPLIED",resultOutcome:"PASS"},
  ]);
  expect(state.rows.map(x=>x.displayName)).toEqual(["Ada","Zara"]);
  expect(state.rows[0]).toMatchObject({attendance:"UNKNOWN",resultOutcome:null});
  expect(state.counts).toMatchObject({total:2,inInterview:1,unknownAttendance:1,stagedResults:1,noResult:1});
 });
 it("does not double-count duplicated joins or guess between conflicting per-application details",()=>{
  const duplicates=buildTpoRoundDriveDayRoster([
   {applicationId:uuid,displayName:"Ada",rollNumber:"42",attendance:"WAITING"},
   {applicationId:uuid,displayName:"Ada",rollNumber:"42",attendance:"PRESENT"},
  ],[{applicationId:uuid,applicationStatus:"SUBMITTED",resultStatus:null,resultOutcome:null}]);
  expect(duplicates.rows).toHaveLength(1);
  expect(duplicates.counts.total).toBe(1);
  const conflicted=buildTpoRoundDriveDayRoster([
   {applicationId:uuid,displayName:"Ada",rollNumber:"42",attendance:"WAITING"},
  ],[
   {applicationId:uuid,applicationStatus:"SUBMITTED",resultStatus:"STAGED",resultOutcome:"PASS"},
   {applicationId:uuid,applicationStatus:"WITHDRAWN",resultStatus:"APPLIED",resultOutcome:"FAIL"},
  ]);
  expect(conflicted.rows).toHaveLength(0);
  expect(conflicted.counts.total).toBe(0);
 });
 it("rejects ambiguous bulk learner identities, double-identification and oversized paste",()=>{
  const roster=[{applicationId:uuid,rollNumber:"42A"},{applicationId:other,rollNumber:"42B"}];
  expect(resolveBulkRoundLearnerTokens("42A,42B",roster)).toEqual({ids:[uuid,other],error:null});
  expect(resolveBulkRoundLearnerTokens("42A;"+uuid,roster).error).toMatch(/more than once/);
  expect(resolveBulkRoundLearnerTokens("42A",[{applicationId:uuid,rollNumber:"42A"},
    {applicationId:other,rollNumber:"42A"}]).error).toMatch(/ambiguous/);
  expect(resolveBulkRoundLearnerTokens("42A",roster,100).error).toMatch(/1–25/);
  expect(resolveBulkRoundLearnerTokens("x".repeat(8001),roster).error).toMatch(/1–25/);
  expect(summarizeBulkRoundResults([
   {applicationId:uuid,status:"staged"},
   {applicationId:other,status:"ineligible",reason:"Not eligible"},
  ])).toEqual({staged:1,ineligible:1});
 });
 it("result table is limited to screened submitted learners and never permits editing already applied grades",()=>{
  const input=[
   {applicationId:uuid,student:"Ada",role:"Engineer",applicationStatus:"SUBMITTED",
    screeningStatus:"SHORTLISTED",resultId:"r",resultStatus:"APPLIED",outcome:"PASS"},
   {applicationId:other,student:"Zara",role:"Engineer",applicationStatus:"SUBMITTED",
    screeningStatus:"SHORTLISTED",resultId:null,resultStatus:null,outcome:null},
   {applicationId:"other-campus",student:"Stranger",role:"Engineer",applicationStatus:"REJECTED",
    screeningStatus:"SHORTLISTED",resultId:null,resultStatus:null,outcome:null},
  ];
  const table=projectTpoRoundResultTable(input,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"PUBLISHED"});
  expect(table.rows).toHaveLength(2);
  expect(table.counts).toEqual({eligible:2,staged:0,applied:1,remaining:1});
  expect(table.rows[0].editable).toBe(false);
  expect(table.rows[1].editable).toBe(true);
  expect(projectTpoRoundResultTable(input,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"CLOSED"}).rows[1].editable).toBe(false);
  const query=tpoRoundResultViewSchema.parse({status:"NOT_RECORDED",q:"eng"});
  expect(filterTpoRoundResultRows(table.rows,query).map(r=>r.applicationId)).toEqual([other]);
 });
 it("escapes CSV formulas, embedded quotes and signed math without changing source totals",()=>{
  const csv=tpoRoundFailureCsv([{roundName:"=HYPERLINK(\"https://bad.example\",\"Open\")",
   branchName:'\t"Safety", hall',failed:2,decisions:10,shareOfRoundPercent:20}]);
  expect(csv.charCodeAt(0)).toBe(65279);
  expect(csv).toContain("\"'=HYPERLINK");
  expect(csv).toContain('\"\'\t\"\"Safety\"\"');
  expect(csv).toContain('\"2\",\"10\",\"20%\"');
  expect(csv.endsWith("\r\n")).toBe(true);
 });
});
