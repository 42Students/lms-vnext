import {describe,expect,it} from "vitest";
import {projectRecruiterRoundResults,recruiterResultTableQuerySchema,recruiterResultTableHref}
 from "@/modules/placements/recruiter-round-results-read-model";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const roundId="123e4567-e89b-42d3-a456-426614174002";
const another="123e4567-e89b-42d3-a456-426614174003";
const person=(id:string,name:string|null,outcome:"PASS"|"FAIL"|"HOLD"|"ABSENT"|null)=>({
 applicationId:id,displayName:name,
 result:outcome?{status:"APPLIED",outcome,scorePercent:outcome==="PASS"?88:null,
  waitlistRank:outcome==="HOLD"?1:null}:null,
});
const participants=[
 person("app-a","Alice","PASS"),person("app-b","Bob","FAIL"),
 person("app-c",null,null),person("app-d","", "HOLD"),person("app-e","Eve","ABSENT"),
];
const rounds=[{id:roundId,name:"Technical",sequence:1,kind:"INTERVIEW",
 status:"COMPLETED",participants}];

describe("HR-ROUND-RESULTS-15 bounded authorized round projections and filters",()=>{
 it("projects only the selected round's participants and never invents unshared candidates",()=>{
  const result=projectRecruiterRoundResults(rounds,roundId,"ALL");
  expect(result?.rows.map(x=>x.key)).toEqual(["app-a","app-b","app-c","app-d","app-e"]);
  expect(result?.counts).toEqual({
   all:5,recorded:4,unrecorded:1,pass:1,fail:1,hold:1,absent:1,
  });
  expect(result?.rows.find(row=>row.key==="app-c")).toMatchObject({
   name:"Candidate",status:"UNRECORDED",outcome:null,
  });
  expect(result?.rows.find(row=>row.key==="app-d")?.name).toBe("Candidate");
  expect(projectRecruiterRoundResults(rounds,another,"ALL")).toBeNull();
 });
 it("all filters produce disjoint result groups with stable aggregate counts",()=>{
  for(const [outcome,expected] of [
   ["RECORDED",4],["UNRECORDED",1],["PASS",1],["FAIL",1],["HOLD",1],["ABSENT",1],
  ] as const){
   const result=projectRecruiterRoundResults(rounds,roundId,outcome);
   expect(result?.rows).toHaveLength(expected);
   expect(result?.counts.all).toBe(5);
   if(outcome==="UNRECORDED")expect(result?.rows[0]?.outcome).toBeNull();
  }
  expect(projectRecruiterRoundResults([],"anything","ALL")).toBeNull();
 });
 it("forged query fields and illegal result outcomes are rejected before loading a candidate",()=>{
  expect(recruiterResultTableQuerySchema.safeParse({
   jobId,roundId,outcome:"PASS",
  }).success).toBe(true);
  for(const input of [
   {jobId:"../foreign"},{jobId,roundId:"another-tenant"},{jobId,outcome:"STAGED_PRIVATE"},
   {jobId,companyId:another},{jobId,limit:100000},
  ])expect(recruiterResultTableQuerySchema.safeParse(input).success).toBe(false);
 });
 it("deep links only expose encoded identifiers and an explicit validated filter",()=>{
  const safe=recruiterResultTableHref({jobId,roundId,outcome:"PASS"});
  expect(safe).toBe("/hr/round-results?jobId="+jobId+"&roundId="+roundId+"&outcome=PASS");
  const escaped=recruiterResultTableHref({jobId:"job/one",roundId:"round&two",outcome:"ALL"});
  expect(escaped).toBe("/hr/round-results?jobId=job%2Fone&roundId=round%26two");
 });
});
