import {describe,expect,it} from "vitest";
import {
 hrInterviewSlotActionSchema,hrInterviewSlotCreateSchema,
 slotTransitionAllowed,slotsOverlap,canRecruiterMutateOwnSlot,
} from "@/modules/placements/hr-interview-slot-model";
import {
 hrRoundFormSchema,canRecruiterEditRound,duplicateRecruiterRoundName,
 matchesRecruiterRoundVersion,
} from "@/modules/placements/hr-round-editor-model";
import {
 initialRecruiterRequestStatus,canRecruiterResubmit,recruiterRequestStage,
} from "@/modules/placements/recruiter-drive-request-model";

const roundId="123e4567-e89b-42d3-a456-426614174001";
const slotId="123e4567-e89b-42d3-a456-426614174002";
const owner="123e4567-e89b-42d3-a456-426614174003";
const starts="2099-01-01T10:00:00+05:30";
const ends="2099-01-01T11:00:00+05:30";
const create={action:"CREATE",roundId,startAt:starts,endAt:ends,
 timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:2};
const version="2099-01-01T04:30:00.123Z";

describe("HR-STATE-MACHINE-43 hostile recruiter round, slot and drive request transitions",()=>{
 it("HR-SLOT-INPUT-43 accepts a bounded future IST block and rejects every invalid interval",()=>{
  expect(hrInterviewSlotCreateSchema.safeParse(create).success).toBe(true);
  for(const changed of [
   {startAt:ends,endAt:starts},
   {startAt:starts,endAt:starts},
   {endAt:"2099-01-01T18:00:01+05:30"},
   {timezone:"UTC"},{mode:"UNKNOWN"},{capacity:0},{capacity:101},
   {capacity:"1.5"},{capacity:"-1"},{roundId:owner.slice(1)},
   {learnerUserId:owner},{panelLabel:"Invalid\nLabel"},
  ])expect(hrInterviewSlotCreateSchema.safeParse({...create,...changed}).success).toBe(false);
 });
 it("HR-SLOT-CAS-43 transitions one slot only forward, never over capacity or after cancellation",()=>{
  for(const [status,action,booked,capacity,allowed] of [
   ["PROPOSED","OFFER",0,2,true],
   ["PROPOSED","BOOK",0,2,false],
   ["PROPOSED","CANCEL",0,2,true],
   ["OFFERED","BOOK",1,2,true],
   ["OFFERED","BOOK",2,2,false],
   ["OFFERED","OFFER",0,2,false],
   ["OFFERED","CANCEL",0,2,true],
   ["BOOKED","BOOK",1,2,true],
   ["BOOKED","CANCEL",1,2,false],
   ["CANCELLED","OFFER",0,2,false],
   ["COMPLETED","BOOK",0,2,false],
   ["PROPOSED","OFFER",-1,2,false],
   ["OFFERED","BOOK",0,0,false],
   ["OFFERED","BOOK",3,2,false],
  ] as const)expect(slotTransitionAllowed(status,action,booked,capacity)).toBe(allowed);
  expect(canRecruiterMutateOwnSlot(owner,owner)).toBe(true);
  expect(canRecruiterMutateOwnSlot(" "," ")).toBe(false);
  expect(canRecruiterMutateOwnSlot(owner,slotId)).toBe(false);
  for(const mutation of [
   {action:"BOOK",slotId,expectedVersion:1},
   {action:"OFFER",slotId,expectedVersion:"2"},
   {action:"CANCEL",slotId,expectedVersion:3},
  ])expect(hrInterviewSlotActionSchema.safeParse(mutation).success).toBe(true);
  for(const mutation of [
   {action:"CANCEL",slotId,expectedVersion:0},
   {action:"BOOK",slotId,expectedVersion:"-1"},
   {action:"BOOK",slotId,expectedVersion:1,adminOverride:true},
  ])expect(hrInterviewSlotActionSchema.safeParse(mutation).success).toBe(false);
 });
 it("HR-SLOT-OVERLAP-43 same endpoints are safe but overlapping and invalid persisted dates fail closed",()=>{
  const a={startAt:new Date(starts),endAt:new Date(ends)};
  const touching={startAt:new Date(ends),endAt:new Date("2099-01-01T12:00:00+05:30")};
  const overlap={startAt:new Date("2099-01-01T10:59:59+05:30"),endAt:touching.endAt};
  expect(slotsOverlap(a,touching)).toBe(false);
  expect(slotsOverlap(a,overlap)).toBe(true);
  expect(slotsOverlap(a,{startAt:a.endAt,endAt:a.startAt})).toBe(true);
  expect(slotsOverlap(a,{startAt:new Date("invalid"),endAt:a.endAt})).toBe(true);
 });
 it("HR-ROUND-VERSION-43 rejects wrong, missing, malformed and stale versions across time zones",()=>{
  const stored=new Date(version);
  expect(matchesRecruiterRoundVersion(stored,"2099-01-01T10:00:00.123+05:30")).toBe(true);
  for(const token of [
   undefined,"not-a-time","2099-01-01T04:30:00.124Z",
   "2099-01-01T04:30:00.000Z",
  ])expect(matchesRecruiterRoundVersion(stored,token)).toBe(false);
 });
 it("HR-ROUND-NAME-43 canonicalizes whitespace, case and Unicode but ignores removed rounds",()=>{
  const existing=[{id:roundId,status:"PENDING",name:"Ｃｏｄｅ   REVIEW"}];
  expect(duplicateRecruiterRoundName(existing,"code review")).toBe(true);
  expect(duplicateRecruiterRoundName(existing," CODE \tREVIEW ",roundId)).toBe(false);
  expect(duplicateRecruiterRoundName([{...existing[0]!,status:"CANCELLED"}],"code review")).toBe(false);
  const locked={status:"PENDING",createdByUserId:owner,recruiterUserId:owner,hasResults:false,hasSlots:false};
  expect(canRecruiterEditRound(locked)).toBe(true);
  for(const patch of [
   {hasResults:true},{hasSlots:true},{status:"COMPLETED"},
   {createdByUserId:slotId},{recruiterUserId:slotId},
  ])expect(canRecruiterEditRound({...locked,...patch})).toBe(false);
 });
 it("HR-ROUND-FORM-43 forbids mixed create/version payload, empty edit and field-bearing deletion",()=>{
  const base={roundId,expectedUpdatedAt:version};
  expect(hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"Technical"}).success).toBe(true);
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",...base}).success).toBe(true);
  expect(hrRoundFormSchema.safeParse({action:"UPDATE",...base,name:"Technical"}).success).toBe(true);
  for(const row of [
   {action:"CREATE",kind:"INTERVIEW",name:"X",...base},
   {action:"REMOVE",...base,kind:"INTERVIEW"},
   {action:"REMOVE",...base,name:"Unexpected"},
   {action:"UPDATE",...base},
   {action:"UPDATE",roundId,name:"X"},
   {action:"DELETE",...base},
   {action:"UPDATE",...base,adminOverride:true,name:"X"},
  ])expect(hrRoundFormSchema.safeParse(row).success).toBe(false);
 });
 it("HR-REQUEST-STATE-43 pending verification never auto-approves, and cancelled requests never reopen",()=>{
  expect(initialRecruiterRequestStatus({trusted:true,approvalRequired:false,verificationPending:true})).toBe("REQUEST");
  expect(initialRecruiterRequestStatus({trusted:false,approvalRequired:false,verificationPending:false})).toBe("DRAFT");
  expect(initialRecruiterRequestStatus({trusted:false,approvalRequired:true,verificationPending:false})).toBe("REQUEST");
  expect(canRecruiterResubmit("REQUEST")).toBe(true);
  expect(canRecruiterResubmit("SENT_BACK")).toBe(true);
  for(const status of ["DRAFT","REJECTED","CANCELLED"] as const)
   expect(canRecruiterResubmit(status)).toBe(false);
  expect(recruiterRequestStage("CANCELLED")).toBe("CLOSED");
  expect(recruiterRequestStage("DRAFT")).toBe("WAITING");
 });
});
