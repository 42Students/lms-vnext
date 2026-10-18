import {describe,expect,it} from "vitest";
import {buildHrOfferOverview,hrSelectionReadyApplicationIds}
 from "@/modules/placements/hr-offer-selection-read-model";
import {recruiterSelectionListInputSchema,recruiterSelectionRangeWarning}
 from "@/modules/placements/recruiter-selection-list-model";
import {hrInlineRoundResultFilters,hrInlineRoundResultsHref}
 from "@/modules/placements/hr-inline-round-results-model";

const a="123e4567-e89b-42d3-a456-426614174001";
const b="123e4567-e89b-42d3-a456-426614174002";
const c="123e4567-e89b-42d3-a456-426614174003";
const now=new Date("2099-01-02T12:00:00.000Z");
const person=(applicationId:string,status:string="APPLIED",outcome:string="PASS")=>({
 applicationId,result:{status,outcome},
});
describe("HR-OFFERS-STATE-14 persisted-offer and selection transitions",()=>{
 it("counts only actual issued/accepted/joined states with exact expiry edge",()=>{
  const rows=[
   {id:a,applicationId:a,status:"ISSUED",expiresAt:new Date(now.getTime()-1),joiningStatus:null},
   {id:b,applicationId:b,status:"ISSUED",expiresAt:now,joiningStatus:null},
   {id:c,applicationId:c,status:"ISSUED",expiresAt:new Date(now.getTime()+1),joiningStatus:null},
   {id:"accepted",applicationId:c,status:"ACCEPTED",expiresAt:null,joiningStatus:"JOINED"},
   {id:"revoked",applicationId:a,status:"WITHDRAWN",expiresAt:null,joiningStatus:null},
  ];
  expect(buildHrOfferOverview(rows,now)).toEqual({
   recorded:5,issued:3,accepted:1,declined:0,joined:1,awaitingReply:2,overdue:1,
  });
  expect(buildHrOfferOverview([],now).recorded).toBe(0);
 });
 it("never selects an applicant from an absent, pending, failed or partly completed evaluative round",()=>{
  const first={kind:"TEST",status:"COMPLETED",participants:[person(a),person(b),person(c)]};
  const second={kind:"INTERVIEW",status:"COMPLETED",
   participants:[person(a),person(b,"APPLIED","HOLD"),person(c,"PENDING","PASS")]};
  expect(hrSelectionReadyApplicationIds([first,second])).toEqual([a]);
  expect(hrSelectionReadyApplicationIds([first,{...second,status:"SCHEDULED"}])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([{kind:"TALK",status:"COMPLETED",participants:[person(a)]}])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([first,{...second,participants:[]}])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([first,{...second,
   participants:[{applicationId:a,result:null}]}])).toEqual([]);
 });
 it("a forged selection cannot impersonate TPO verification or duplicate applications",()=>{
  const valid={jobId:a,collegeId:b,submissionId:c,kind:"OFFER",
   ctcLpa:"12",applicationIds:[a,b],acknowledgedCtcWarning:true};
  expect(recruiterSelectionListInputSchema.safeParse(valid).success).toBe(true);
  for(const changed of [
   {applicationIds:[a,a]},{applicationIds:[]},{applicationIds:Array(201).fill(a)},
   {kind:"VERIFIED"},{collegeId:"foreign"},{ctcLpa:"-1"},
   {ctcLpa:"9999"},{approvedByUserId:a},{packageDescription:"x".repeat(501)},
  ])expect(recruiterSelectionListInputSchema.safeParse({...valid,...changed}).success).toBe(false);
  expect(recruiterSelectionRangeWarning("12",1_000_000,1_500_000)).toBeNull();
  expect(recruiterSelectionRangeWarning("9.99",1_000_000,1_500_000)).toContain("outside");
  expect(recruiterSelectionRangeWarning("15.01",1_000_000,1_500_000)).toContain("outside");
 });
 it("round result links encode job and round identifiers and do not reveal internal rows",()=>{
  expect(hrInlineRoundResultsHref("job/one","round&two","UNRECORDED"))
   .toBe("/hr/placements/jobs/job%2Fone?tab=rounds&roundId=round%26two&outcome=UNRECORDED");
  expect(hrInlineRoundResultFilters({
   all:10,recorded:5,unrecorded:5,pass:2,fail:1,hold:1,absent:1,
  }).find(row=>row.value==="UNRECORDED")).toEqual({
   value:"UNRECORDED",label:"Not recorded",count:5,
  });
 });
});
