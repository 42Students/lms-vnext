import {describe,expect,it} from "vitest";
import {
 TPO_STUDENT_JOURNEY_STATES,tpoStudentMatchesLegacyStage,tpoStudentNeedsAttention,
 type TpoStudentRow,
} from "@/modules/placements/tpo-students-model";

const base:TpoStudentRow={
 membershipId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
 displayName:"Example Learner",email:null,rollNumber:null,registrationNumber:null,
 branchId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
 branchName:"Computer",programId:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
 programName:"B.Tech",cohortId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
 cohortName:"2099",classIds:[],registrationChoice:null,
 registrationOpen:false,registeredForPlacements:false,
 participationStatus:"ELIGIBLE",debarred:false,
 verification:{status:"VERIFIED",waitingSections:[],verifiedSections:[]},
 preferencesPresent:false,cgpa:null,activeBacklogs:0,pastBacklogs:0,
 applicationCount:0,activeApplicationCount:0,offerCount:0,
 acceptedOfferCount:0,verifiedExternalOfferCount:0,
 offersAwaitingAnswer:0,ambiguousSection:false,
 journeyState:"NOT_REGISTERED",bestSoFar:"Not applied",
 maximumAppliedRoundSequence:null,
 readinessSignal:"PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT",placed:false,
};

describe("TPO-students-18/23 legacy stage flags are orthogonal to journey state",()=>{
 it("covers all five legacy-stage filters, including explicitly false flags",()=>{
  const stages=["ELIGIBLE","INVITED","REGISTERED","VERIFIED","PLACED"] as const;
  expect(TPO_STUDENT_JOURNEY_STATES).toEqual([
   "NOT_REGISTERED","NEEDS_READINESS_SUPPORT","READY_NOT_APPLYING","APPLYING","PLACED",
  ]);
  expect(stages.map(stage=>tpoStudentMatchesLegacyStage(base,stage)))
   .toEqual([true,false,false,true,false]);
  const changed={...base,participationStatus:"INELIGIBLE" as const,
   registrationOpen:true,registeredForPlacements:true,placed:true,
   verification:{...base.verification,status:"WAITING" as const}};
  expect(stages.map(stage=>tpoStudentMatchesLegacyStage(changed,stage)))
   .toEqual([false,true,true,false,true]);
  expect(tpoStudentMatchesLegacyStage({
   ...changed,registrationOpen:null,
  },"INVITED")).toBe(false);
 });
 it("reports every independent reason the placement cell must investigate",()=>{
  const cases:Partial<TpoStudentRow>[]=[
   {debarred:true},
   {participationStatus:"INELIGIBLE"},
   {verification:{...base.verification,status:"WAITING"}},
   {verification:{...base.verification,status:"SENT_BACK"}},
   {offersAwaitingAnswer:1},
   {ambiguousSection:true},
   {readinessSignal:"ACADEMIC_EVIDENCE_MISSING"},
  ];
  expect(tpoStudentNeedsAttention(base)).toBe(false);
  for(const scenario of cases){
   expect(tpoStudentNeedsAttention({...base,...scenario}),
    JSON.stringify(scenario)).toBe(true);
  }
 });
 it("does not mark a placed learner as needing attention solely due to historic placement",()=>{
  const completed={...base,placed:true,
   verification:{...base.verification,status:"VERIFIED" as const}};
  expect(tpoStudentNeedsAttention(completed)).toBe(false);
  expect(tpoStudentMatchesLegacyStage(completed,"PLACED")).toBe(true);
 });
});
