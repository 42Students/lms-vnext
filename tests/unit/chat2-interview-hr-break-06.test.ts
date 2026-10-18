import {describe,expect,it} from "vitest";
import {hrInterviewSlotCreateSchema,hrInterviewSlotActionSchema,slotTransitionAllowed,
 slotsOverlap,parseIstLocalSlot,canRecruiterMutateOwnSlot} from "@/modules/placements/hr-interview-slot-model";
import {hrRoundFormSchema,canRecruiterEditRound,duplicateRecruiterRoundName,
 matchesRecruiterRoundVersion} from "@/modules/placements/hr-round-editor-model";
import {duplicateHrDraftRound} from "@/modules/placements/hr-draft-round-duplicate-model";
import {reorderHrDraftRound} from "@/modules/placements/hr-draft-round-order-model";
import type {HrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {TPO_DRIVE_ROUND_PRESETS,isTpoRoundPresetKey,plannedTpoRoundRows}
 from "@/modules/placements/tpo-drive-round-presets";
const uuid="00000000-0000-4000-8000-000000000001";

describe("TPO-BREAK-HR-round-06 creator permissions, state transitions, IST time and safe templates",()=>{
 it("refuses spoofed recruiter slot identity, malformed capacity and negative duration",()=>{
  const slot={roundId:uuid,startAt:"2026-10-20T04:00:00Z",
   endAt:"2026-10-20T04:30:00Z",timezone:"Asia/Kolkata",
   mode:"ON_CAMPUS",meetingLocation:"Hall A",capacity:2};
  expect(hrInterviewSlotCreateSchema.safeParse(slot).success).toBe(true);
  for(const patch of [
   {capacity:0},{capacity:101},{capacity:"1e2"},{capacity:-1},
   {startAt:slot.endAt},{endAt:slot.startAt},{timezone:"UTC"},
   {mode:"SECRET"},{collegeId:"other-campus"},{panelLabel:"\u0000bad"},
   {endAt:"2026-10-22T04:30:00Z"},
  ])expect(hrInterviewSlotCreateSchema.safeParse({...slot,...patch}).success).toBe(false);
  expect(hrInterviewSlotActionSchema.safeParse({slotId:uuid,expectedVersion:1,action:"BOOK"}).success).toBe(true);
  expect(hrInterviewSlotActionSchema.safeParse({slotId:uuid,expectedVersion:0,action:"BOOK"}).success).toBe(false);
  expect(hrInterviewSlotActionSchema.safeParse({slotId:uuid,expectedVersion:"1.5",action:"BOOK"}).success).toBe(false);
 });
 it("enforces a closed recruiter slot transition matrix and capacity invariant",()=>{
  const rows=[
   ["PROPOSED","OFFER",0,1,true],
   ["PROPOSED","BOOK",0,1,false],
   ["PROPOSED","CANCEL",0,1,true],
   ["OFFERED","BOOK",0,1,true],
   ["OFFERED","BOOK",1,1,false],
   ["OFFERED","CANCEL",0,1,true],
   ["BOOKED","BOOK",1,2,true],
   ["BOOKED","BOOK",2,2,false],
   ["BOOKED","CANCEL",1,2,false],
   ["CANCELLED","BOOK",0,1,false],
  ] as const;
  for(const [status,action,booked,capacity,allowed] of rows)
   expect(slotTransitionAllowed(status,action,booked,capacity),
    status+" "+action).toBe(allowed);
  for(const bad of [-1,0.5,Number.NaN,101])
   expect(slotTransitionAllowed("OFFERED","BOOK",bad,1)).toBe(false);
  expect(canRecruiterMutateOwnSlot("actor-1","actor-1")).toBe(true);
  expect(canRecruiterMutateOwnSlot("actor-1","attacker")).toBe(false);
  expect(canRecruiterMutateOwnSlot("","")).toBe(false);
 });
 it("allows touching intervals but treats invalid persisted timing as a collision",()=>{
  const interval=(start:string,end:string)=>({startAt:new Date(start),endAt:new Date(end)});
  const first=interval("2026-10-20T04:00:00Z","2026-10-20T04:30:00Z");
  expect(slotsOverlap(first,interval("2026-10-20T04:30:00Z","2026-10-20T05:00:00Z"))).toBe(false);
  expect(slotsOverlap(first,interval("2026-10-20T04:29:00Z","2026-10-20T05:00:00Z"))).toBe(true);
  expect(slotsOverlap(first,interval("invalid","2026-10-20T05:00:00Z"))).toBe(true);
  expect(slotsOverlap(first,interval("2026-10-20T05:00:00Z","2026-10-20T04:30:00Z"))).toBe(true);
  expect(parseIstLocalSlot("2026-10-20T10:15")).toBe("2026-10-20T10:15:00+05:30");
  expect(()=>parseIstLocalSlot("2026-02-30T10:15")).toThrow("INVALID_IST_DATE");
 });
 it("HR round editing requires the owning recruiter, current draft state and fresh ISO version",()=>{
  const state={status:"PENDING",createdByUserId:"rec",recruiterUserId:"rec",hasResults:false,hasSlots:false};
  expect(canRecruiterEditRound(state)).toBe(true);
  expect(canRecruiterEditRound({...state,createdByUserId:"other"})).toBe(false);
  expect(canRecruiterEditRound({...state,status:"SCHEDULED"})).toBe(false);
  expect(canRecruiterEditRound({...state,hasResults:true})).toBe(false);
  expect(canRecruiterEditRound({...state,hasSlots:true})).toBe(false);
  const date=new Date("2026-10-20T04:00:00Z");
  expect(matchesRecruiterRoundVersion(date,"2026-10-20T09:30:00+05:30")).toBe(true);
  expect(matchesRecruiterRoundVersion(date,"2026-10-20T04:00:01Z")).toBe(false);
  expect(matchesRecruiterRoundVersion(date,"not-a-date")).toBe(false);
  const rounds=[{id:uuid,name:" Technical  Interview ",status:"PENDING"}];
  expect(duplicateRecruiterRoundName(rounds,"technical interview")).toBe(true);
  expect(duplicateRecruiterRoundName(rounds,"Technical Interview",uuid)).toBe(false);
  expect(duplicateRecruiterRoundName(rounds,"Technical Interview","other")).toBe(true);
 });
 it("strict HR round commands reject stale updates and spoofed new round IDs",()=>{
  expect(hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"Technical"}).success).toBe(true);
  expect(hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"Technical",roundId:uuid}).success).toBe(false);
  expect(hrRoundFormSchema.safeParse({action:"UPDATE",roundId:uuid,expectedUpdatedAt:"2026-10-20T04:00:00Z"}).success).toBe(false);
  expect(hrRoundFormSchema.safeParse({action:"UPDATE",roundId:uuid,expectedUpdatedAt:"2026-10-20T04:00:00Z",name:"HR"}).success).toBe(true);
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:uuid,expectedUpdatedAt:"2026-10-20T04:00:00Z",kind:"TALK"}).success).toBe(false);
  expect(hrRoundFormSchema.safeParse({action:"UPDATE",roundId:"other",name:"No version"}).success).toBe(false);
 });
 it("draft round copies and reordering cannot overrun a bounded draft or mutate the source",()=>{
  const draft={rounds:[{name:"Test",kind:"TEST"},{name:"Interview",kind:"INTERVIEW"}]} as unknown as HrDriveDraft;
  const copy=duplicateHrDraftRound(draft,0);
  expect(copy).not.toBe(draft);
  expect(copy.rounds.map(r=>r.name)).toEqual(["Test","Test (copy)","Interview"]);
  expect(draft.rounds.map(r=>r.name)).toEqual(["Test","Interview"]);
  expect(duplicateHrDraftRound(draft,99)).toBe(draft);
  const moved=reorderHrDraftRound(draft,0,1);
  expect(moved.rounds.map(r=>r.name)).toEqual(["Interview","Test"]);
  expect(reorderHrDraftRound(draft,0,-1)).toBe(draft);
 });
 it("TPO preset keys never inherit prototype names and never fabricate a room or schedule",()=>{
  expect(isTpoRoundPresetKey("TEST_GD_INTERVIEW")).toBe(true);
  for(const name of ["toString","__proto__","constructor","FAKE"])
   expect(isTpoRoundPresetKey(name)).toBe(false);
  const rounds=plannedTpoRoundRows("TEST_GD_INTERVIEW");
  expect(rounds.map(r=>r.kind)).toEqual(["TEST","GD","INTERVIEW"]);
  expect(rounds.map(r=>r.sequence)).toEqual([1,2,3]);
  expect(JSON.stringify(rounds)).not.toMatch(/venue|meetingUrl|scheduledAt/);
  expect(TPO_DRIVE_ROUND_PRESETS.NONE.rounds).toHaveLength(0);
 });
});
