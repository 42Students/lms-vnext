import {describe,expect,it} from "vitest";
import {
 tpoInterviewSlotActionSchema,planInterviewDay,sameInterviewRoom,overlapsInterviewRoom,
} from "@/modules/placements/tpo-interview-slot-model";
import {moveRound,roundReorderLockMessage} from "@/modules/placements/tpo-round-reorder-model";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";

const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const future="2099-07-03T09:00:00+05:30";
const generate={action:"GENERATE_DAY",confirmed:true,startsAt:future,
 durationMinutes:15,gapMinutes:5,slotsPerRoom:2,rooms:["Lab A","Lab B"]} as const;
const book={action:"BOOK",confirmed:true,slotId:id(1),applicationId:id(2),expectedVersion:1} as const;

describe("TPO-drive-workspace-44 interview slots/rounds service input ledger",()=>{
 it("TPO-drive-workspace-44 requires confirmed, versioned and tenant-independent slot commands",()=>{
  const valid=[
   generate,book,
   {action:"MOVE",confirmed:true,slotId:id(1),targetSlotId:id(2),expectedVersion:2,reason:"Recruiter asked"},
   {action:"CANCEL",confirmed:true,slotId:id(1),expectedVersion:2,reason:"Venue closed"},
   {action:"CLEAR_AVAILABLE",confirmed:true},
   {action:"ASSIGN_ROOMS_BY_ROLL",confirmed:true,fromRoll:"1",toRoll:"9",room:"Lab C"},
   {action:"CONFIRM_RECRUITER_PROPOSAL",confirmed:true,proposalId:id(3),expectedVersion:1,venue:"Lab C"},
   {action:"MOVE_REQUEST",confirmed:true,requestId:id(3),targetSlotId:id(2),reason:"Candidate request"},
   {action:"KEEP_REQUEST",confirmed:true,requestId:id(3),reason:"Existing slot works"},
   {action:"ASSIGN_ROOM",confirmed:true,slotId:id(1),expectedVersion:1,room:"Lab D"},
  ];
  for(const action of valid)
   expect(tpoInterviewSlotActionSchema.safeParse(action).success,JSON.stringify(action)).toBe(true);
  for(const action of [
   {...book,confirmed:false},
   {...book,expectedVersion:0},
   {...book,slotId:"../../../foreign"},
   {...book,collegeId:id(9)},
   {...book,applicationId:"not-a-uuid"},
   {...generate,rooms:[]},
   {...generate,slotsPerRoom:101},
   {...generate,durationMinutes:0},
   {...generate,gapMinutes:-1},
   {action:"MOVE",confirmed:true,slotId:id(1),targetSlotId:id(2),expectedVersion:1,reason:"x"},
   {action:"CANCEL",confirmed:true,slotId:id(1),expectedVersion:1,reason:" "},
   {action:"FORCE_BOOK",confirmed:true,slotId:id(1),applicationId:id(2)},
  ])expect(tpoInterviewSlotActionSchema.safeParse(action).success,JSON.stringify(action)).toBe(false);
 });
 it("TPO-drive-workspace-44 plans exactly bounded, gap-separated physical slots",()=>{
  const slots=planInterviewDay({...generate,rooms:[...generate.rooms]});
  expect(slots).toHaveLength(4);
  expect(slots[0]).toEqual({
   room:"Lab A",startsAt:new Date("2099-07-03T03:30:00.000Z"),
   endsAt:new Date("2099-07-03T03:45:00.000Z"),
  });
  expect(slots[1].startsAt.toISOString()).toBe("2099-07-03T03:50:00.000Z");
  expect(slots[2].room).toBe("Lab B");
  expect(slots[3].endsAt.toISOString()).toBe("2099-07-03T04:05:00.000Z");
  expect(()=>planInterviewDay({...generate,rooms:["Lab A","lab a"]})).toThrow("Room names must be different");
  expect(()=>planInterviewDay({...generate,rooms:["A","Ａ"]})).toThrow("Room names must be different");
  expect(()=>planInterviewDay({...generate,startsAt:"2099-07-03T23:50:00+05:30",durationMinutes:30,slotsPerRoom:1})).toThrow("before midnight");
  expect(()=>planInterviewDay({...generate,slotsPerRoom:0})).toThrow("Invalid interview day configuration");
 });
 it("TPO-drive-workspace-44 protects casefolded and Unicode-normalized room collisions",()=>{
  const d=(iso:string)=>new Date(iso);
  const row={room:"ROOM A",startsAt:d("2099-07-03T09:00:00Z"),endsAt:d("2099-07-03T09:30:00Z")};
  expect(sameInterviewRoom(" Room A ","ROOM A")).toBe(true);
  expect(sameInterviewRoom("ＲＯＯＭ Ａ","room a")).toBe(true);
  expect(overlapsInterviewRoom({...row,room:" room a "},[row])).toBe(true);
  expect(overlapsInterviewRoom({...row,startsAt:row.endsAt,endsAt:d("2099-07-03T10:00:00Z")},[row])).toBe(false);
  expect(overlapsInterviewRoom({...row,room:"Lab B"},[row])).toBe(false);
  expect(overlapsInterviewRoom({...row,startsAt:new Date("invalid")},[])).toBe(true);
  expect(overlapsInterviewRoom(row,[{...row,endsAt:new Date("invalid")}])).toBe(true);
 });
});

describe("TPO-drive-workspace-37 round plan immutability",()=>{
 it("TPO-drive-workspace-37 never reorders ended, live or artifact-bearing plans",()=>{
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false})).toBeNull();
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["PENDING"],hasExecutionArtifacts:false})).toContain("at least two");
  expect(roundReorderLockMessage({jobStatus:"CLOSED",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false})).toContain("locked");
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["COMPLETED","PENDING"],hasExecutionArtifacts:false})).toContain("locked");
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:true})).toContain("locked");
  expect(moveRound(["one","two","three"],"one",2)).toEqual(["two","three","one"]);
  expect(moveRound(["one","two","three"],"unknown",0)).toEqual(["one","two","three"]);
  expect(moveRound(["one","one"],"one",1)).toEqual(["one","one"]);
  expect(moveRound(["one","two"],"one",Number.NaN)).toEqual(["one","two"]);
 });
});

describe("TPO last-third real-time round timing",()=>{
 it("UX-tpo-LAST-THIRD-01 never invents elapsed time for future or invalid clocks",()=>{
  const duration={scheduledAt:"2099-07-03T09:00:00.000Z",durationMinutes:30};
  expect(tpoLiveRoundTiming(duration,"2099-07-03T09:15:00.000Z")).toEqual({elapsedMinutes:15,remainingMinutes:15});
  expect(tpoLiveRoundTiming(duration,"2099-07-03T10:00:00.000Z")).toEqual({elapsedMinutes:60,remainingMinutes:0});
  expect(tpoLiveRoundTiming(duration,"2099-07-03T08:00:00.000Z")).toEqual({elapsedMinutes:null,remainingMinutes:null});
  expect(tpoLiveRoundTiming({...duration,scheduledAt:"bad"},"2099-07-03T09:15:00.000Z")).toEqual({elapsedMinutes:null,remainingMinutes:null});
  expect(tpoLiveRoundTiming({...duration,durationMinutes:Number.NaN},"2099-07-03T09:15:00.000Z")).toEqual({elapsedMinutes:null,remainingMinutes:null});
 });
});
