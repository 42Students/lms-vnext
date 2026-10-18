import {describe,expect,it} from "vitest";
import {bulkTpoRoundResultSchema,summarizeBulkRoundResults} from "@/modules/placements/tpo-bulk-round-result-model";
import {confirmedTpoRoundResultSchema,TPO_RESULT_LABELS} from "@/modules/placements/tpo-confirmed-round-result-model";
import {tpoRoundFailureCsvQuerySchema,tpoRoundFailureCsv} from "@/modules/placements/tpo-round-failure-csv-model";
import {tpoRoundResultTableQuerySchema,projectTpoRoundResultTable} from "@/modules/placements/tpo-round-result-table-model";
import {TPO_ROUND_ATTENDANCE_STATES} from "@/modules/placements/tpo-round-drive-day-model";

const id=(index:number)=>"00000000-0000-4000-8000-"+String(index).padStart(12,"0");
const result=(index:number,outcome:"PASS"|"FAIL"|"HOLD"|"ABSENT"="PASS",waitlistRank?:number)=>({
 applicationId:id(index),outcome,...(waitlistRank===undefined?{}:{waitlistRank}),
 ...(outcome==="PASS"?{}:{candidateMessage:"Reviewed and recorded by the placement cell."}),
});
const entry=(index:number,outcome:"PASS"|"FAIL"|"HOLD"|"ABSENT"="PASS",rank?:number)=>({
 expectedCurrentResultId:null,result:result(index,outcome,rank),
});
describe("TPO-BREAK-round-contracts-11 validation and state evidence, no tenant or rank guessing",()=>{
 it("single result requires an explicit confirm, current version and strictly validated learner decision",()=>{
  const valid={confirmed:true,expectedCurrentResultId:null,result:result(1)};
  expect(confirmedTpoRoundResultSchema.safeParse(valid).success).toBe(true);
  for(const malformed of [
   {...valid,confirmed:false},{...valid,expectedCurrentResultId:"bad"},
   {...valid,companyId:id(2)}, {...valid,result:{...valid.result,collegeId:id(2)}},
   {...valid,result:result(1,"HOLD")},{...valid,result:{applicationId:id(1),outcome:"FAIL"}},
   {...valid,result:result(1,"PASS",3)},{...valid,result:result(1,"HOLD",0)},
  ])expect(confirmedTpoRoundResultSchema.safeParse(malformed).success).toBe(false);
  expect(confirmedTpoRoundResultSchema.safeParse({
   ...valid,result:result(1,"HOLD",1),
  }).success).toBe(true);
  expect(confirmedTpoRoundResultSchema.safeParse({
   ...valid,expectedCurrentResultId:id(2),
  }).success).toBe(true);
  // A fully explained FAIL is valid; only unexplained non-PASS results are rejected.
  expect(confirmedTpoRoundResultSchema.safeParse({...valid,result:result(1,"FAIL")}).success).toBe(true);
 });
 it("bulk staging cannot accept duplicated applicants, repeated hold ranks or oversized payloads",()=>{
  const valid={confirmed:true,entries:[entry(1),entry(2,"HOLD",4)]};
  expect(bulkTpoRoundResultSchema.safeParse(valid).success).toBe(true);
  const bad=[
   {...valid,confirmed:false}, {...valid,companyId:id(2)},
   {...valid,entries:[]},
   {...valid,entries:[entry(1),entry(1)]},
   {...valid,entries:[entry(1,"HOLD",4),entry(2,"HOLD",4)]},
   {...valid,entries:[entry(1,"HOLD",4),entry(2,"HOLD",0)]},
   {...valid,entries:[entry(1),{...entry(2),result:{...result(2),collegeId:id(3)}}]},
   {...valid,entries:Array.from({length:26},(_,i)=>entry(i+1))},
  ];
  for(const input of bad)expect(bulkTpoRoundResultSchema.safeParse(input).success).toBe(false);
  expect(bulkTpoRoundResultSchema.safeParse({
   ...valid,entries:Array.from({length:25},(_,i)=>entry(i+1)),
  }).success).toBe(true);
 });
 it("partial batch counts only persisted outcomes, with no invented success for ineligible rows",()=>{
  expect(summarizeBulkRoundResults([
   {applicationId:id(1),status:"staged",resultId:id(1)},
   {applicationId:id(2),status:"ineligible",reason:"Application not shortlisted"},
   {applicationId:id(3),status:"ineligible",reason:"Version changed"},
  ])).toEqual({staged:1,ineligible:2});
 });
 it("round table IDs and CSV filters reject forged tenant parameters",()=>{
  expect(tpoRoundResultTableQuerySchema.safeParse({jobId:id(1),roundId:id(2)}).success).toBe(true);
  expect(tpoRoundResultTableQuerySchema.safeParse({jobId:id(1),roundId:id(2),collegeId:id(3)}).success).toBe(false);
  expect(tpoRoundResultTableQuerySchema.safeParse({jobId:"../../other",roundId:id(2)}).success).toBe(false);
  expect(tpoRoundFailureCsvQuerySchema.safeParse({}).success).toBe(true);
  expect(tpoRoundFailureCsvQuerySchema.safeParse({seasonId:id(1),jobId:id(2)}).success).toBe(true);
  expect(tpoRoundFailureCsvQuerySchema.safeParse({collegeId:id(3)}).success).toBe(false);
  expect(tpoRoundFailureCsvQuerySchema.safeParse({jobId:"foreign"}).success).toBe(false);
 });
 it("do not count withdrawn students or make already-applied round results editable",()=>{
  const rows=[
   {applicationId:id(1),student:"Ada",role:"Developer",applicationStatus:"SUBMITTED",
    screeningStatus:"SHORTLISTED",resultId:null,resultStatus:null,outcome:null},
   {applicationId:id(2),student:"Bob",role:"Developer",applicationStatus:"SUBMITTED",
    screeningStatus:"SHORTLISTED",resultId:id(4),resultStatus:"APPLIED",outcome:"PASS"},
   {applicationId:id(3),student:"Unsubmitted",role:"Developer",applicationStatus:"WITHDRAWN",
    screeningStatus:"SHORTLISTED",resultId:null,resultStatus:null,outcome:null},
  ];
  const out=projectTpoRoundResultTable(rows,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"PUBLISHED"});
  expect(out.rows).toHaveLength(2);
  expect(out.counts).toEqual({eligible:2,staged:0,applied:1,remaining:1});
  expect(out.rows.find(x=>x.applicationId===id(1))?.editable).toBe(true);
  expect(out.rows.find(x=>x.applicationId===id(2))?.editable).toBe(false);
  expect(projectTpoRoundResultTable(rows,{kind:"TALK",status:"COMPLETED",jobStatus:"PUBLISHED"})
   .rows.every(x=>!x.editable)).toBe(true);
 });
 it("retains legacy round decisions, honest attendance states and formula-safe CSV export",()=>{
  expect(TPO_RESULT_LABELS).toEqual({
   PASS:"Shortlisted for next round",FAIL:"Not selected in this round",
   HOLD:"On hold / waitlisted",ABSENT:"Absent from round",
  });
  expect(TPO_ROUND_ATTENDANCE_STATES).toEqual([
   "WAITING","PRESENT","IN_INTERVIEW","DONE","ABSENT",
  ]);
  const csv=tpoRoundFailureCsv([
   {roundName:'=HYPERLINK("https://evil.test")',branchName:"+attacker",
    failed:1,decisions:2,shareOfRoundPercent:50},
  ]);
  expect(csv).toContain('"\'=HYPERLINK(""https://evil.test"")"');
  expect(csv).toContain('"\'+attacker"');
  expect(csv).toContain('"50%"');
  expect(csv.startsWith("\uFEFF")).toBe(true);
 });
});
