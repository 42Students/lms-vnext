import {describe,expect,it} from "vitest";
import {buildHrOfferOverview,hrSelectionReadyApplicationIds}
 from "@/modules/placements/hr-offer-selection-read-model";
import {recruiterSelectionListInputSchema,recruiterSelectionRangeWarning,RECRUITER_SELECTION_STAGES}
 from "@/modules/placements/recruiter-selection-list-model";

const a="123e4567-e89b-42d3-a456-426614174001",b="123e4567-e89b-42d3-a456-426614174002";
const c="123e4567-e89b-42d3-a456-426614174003";
const pass=(applicationId:string)=>({applicationId,result:{status:"APPLIED",outcome:"PASS"}});
const fail=(applicationId:string)=>({applicationId,result:{status:"APPLIED",outcome:"FAIL"}});

describe("HR-BREAK-offers-01: offers, selection verification, joining journey",()=>{
 it("counts only persisted current offer states, not expired versus unexpired by guessed status",()=>{
  const now=new Date("2026-10-18T08:00:00.000Z");
  const offers=[
   {id:a,applicationId:a,status:"ISSUED",expiresAt:new Date(now.getTime()-1),joiningStatus:null},
   {id:b,applicationId:a,status:"ISSUED",expiresAt:new Date(now.getTime()),joiningStatus:null},
   {id:c,applicationId:b,status:"ACCEPTED",expiresAt:null,joiningStatus:"JOINED"},
   {id:"d",applicationId:b,status:"DECLINED",expiresAt:null,joiningStatus:null},
   {id:"e",applicationId:c,status:"REVOKED",expiresAt:null,joiningStatus:null},
  ];
  expect(buildHrOfferOverview(offers,now)).toEqual({
   recorded:5,issued:2,accepted:1,declined:1,joined:1,awaitingReply:1,overdue:1,
  });
 });
 it("will not mark a learner selection-ready until every evaluative round has completed and passed",()=>{
  expect(hrSelectionReadyApplicationIds([])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([{kind:"TALK",status:"COMPLETED",participants:[pass(a)]}])).toEqual([]);
  const first={kind:"TEST",status:"COMPLETED",participants:[pass(a),pass(b),fail(c)]};
  const second={kind:"INTERVIEW",status:"COMPLETED",participants:[pass(a),fail(b),pass(c)]};
  expect(hrSelectionReadyApplicationIds([first,second])).toEqual([a]);
  expect(hrSelectionReadyApplicationIds([first,{...second,status:"SCHEDULED"}])).toEqual([]);
  expect(hrSelectionReadyApplicationIds([first,{...second,participants:[{applicationId:a,result:{status:"PENDING",outcome:"PASS"}}]}])).toEqual([]);
 });
 it("rejects duplicate, empty, oversized, cross-field invalid or malformed selection proposals",()=>{
  const draft={jobId:a,collegeId:b,submissionId:c,kind:"OFFER",ctcLpa:"12.50",
   applicationIds:[a,b],acknowledgedCtcWarning:true};
  expect(recruiterSelectionListInputSchema.safeParse(draft).success).toBe(true);
  for(const change of [{applicationIds:[a,a]},{applicationIds:[]},
   {applicationIds:Array.from({length:201},()=>a)},{jobId:"another-tenant"},
   {kind:"NOT_A_SELECTION"},{ctcLpa:"-5"},{ctcLpa:"2000"},
   {ctcLpa:"not-a-number"},{packageDescription:"x".repeat(501)},{unknown:"privileged"}]){
   expect(recruiterSelectionListInputSchema.safeParse({...draft,...change}).success).toBe(false);
  }
  expect(RECRUITER_SELECTION_STAGES).toContain("SENT_FOR_VERIFICATION");
  expect(RECRUITER_SELECTION_STAGES).toContain("SENT_BACK");
  expect(RECRUITER_SELECTION_STAGES).toContain("DECLINED");
 });
 it("warns when compensation falls outside the actual drive range, including boundary prices",()=>{
  expect(recruiterSelectionRangeWarning("10",1_000_000,1_500_000)).toBeNull();
  expect(recruiterSelectionRangeWarning("15",1_000_000,1_500_000)).toBeNull();
  expect(recruiterSelectionRangeWarning("9.99",1_000_000,1_500_000)).toMatch(/outside/);
  expect(recruiterSelectionRangeWarning("15.01",1_000_000,1_500_000)).toMatch(/outside/);
  expect(recruiterSelectionRangeWarning("",1_000_000,1_500_000)).toBeNull();
 });
});