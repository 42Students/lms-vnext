import {expect,it} from "vitest";
import {hrInterviewSlotCreateSchema,slotTransitionAllowed,slotsOverlap,canRecruiterMutateOwnSlot} from "@/modules/placements/hr-interview-slot-model";
it("requires an IST interval and capacity without candidate identities",()=>{
 const row={roundId:"11111111-1111-4111-8111-111111111111",
 startAt:"2026-10-20T10:00:00+05:30",endAt:"2026-10-20T11:00:00+05:30",
 timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:2};
 expect(hrInterviewSlotCreateSchema.safeParse(row).success).toBe(true);
 expect(hrInterviewSlotCreateSchema.safeParse({...row,capacity:101}).success).toBe(false);
 expect(hrInterviewSlotCreateSchema.safeParse({...row,learnerId:row.roundId}).success).toBe(false);
});
it("permits only forward offer/book transitions and detects overlapping time windows",()=>{
 expect(slotTransitionAllowed("PROPOSED","OFFER")).toBe(true);
 expect(slotTransitionAllowed("PROPOSED","BOOK")).toBe(false);
 expect(slotsOverlap({startAt:new Date("2026-10-20T09:00Z"),endAt:new Date("2026-10-20T10:00Z")},
 {startAt:new Date("2026-10-20T09:30Z"),endAt:new Date("2026-10-20T10:30Z")})).toBe(true);
});

it("HR-SLOT-ACTOR-01 forbids whitespace-only, missing and different slot creators",()=>{
 expect(canRecruiterMutateOwnSlot("recruiter-a","recruiter-a")).toBe(true);
 for(const [creator,actor] of [
  ["",""],[" "," "],["  ","  "],["recruiter-a","recruiter-b"],
  ["recruiter-a",""],["","recruiter-a"],
 ]){
  expect(canRecruiterMutateOwnSlot(creator,actor)).toBe(false);
 }
});
it("HR-SLOT-STATE-02 refuses stale-capacity and forbidden stage transitions",()=>{
 for(const status of ["CANCELLED","COMPLETED","REJECTED",""])
  for(const action of ["OFFER","BOOK","CANCEL"] as const)
   expect(slotTransitionAllowed(status,action,0,2)).toBe(false);
 expect(slotTransitionAllowed("PROPOSED","CANCEL",0,2)).toBe(true);
 expect(slotTransitionAllowed("OFFERED","BOOK",1,2)).toBe(true);
 expect(slotTransitionAllowed("OFFERED","BOOK",2,2)).toBe(false);
 expect(slotTransitionAllowed("BOOKED","BOOK",1,2)).toBe(true);
 for(const count of [-1,3,1.5,Number.NaN])
  expect(slotTransitionAllowed("OFFERED","BOOK",count,2)).toBe(false);
});
