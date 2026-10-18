import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {overlapsInterviewRoom,planInterviewDay,sameInterviewRoom,tpoInterviewSlotActionSchema} from "@/modules/placements/tpo-interview-slot-model";
import {overlappingInterviewVenue,validInterviewWindow} from "@/modules/placements/tpo-interview-reschedule-model";

// TPO-drive-workspace-44: direct callers must be as safe as schema-validated API callers.
const input={
 startsAt:"2026-10-20T09:00:00+05:30",
 durationMinutes:30,
 gapMinutes:5,
 slotsPerRoom:2,
 rooms:["Room A","Room B"],
} as const;

describe("TPO-BREAK-interview-01 day planner and venue safety",()=>{
 it("generates IST-scoped slots with non-overlapping sequential starts and exact end instants",()=>{
  const slots=planInterviewDay(input);
  expect(slots).toHaveLength(4);
  expect(slots.map(slot=>slot.room)).toEqual(["Room A","Room A","Room B","Room B"]);
  expect(slots[0].startsAt.toISOString()).toBe("2026-10-20T03:30:00.000Z");
  expect(slots[0].endsAt.toISOString()).toBe("2026-10-20T04:00:00.000Z");
  expect(slots[1].startsAt.toISOString()).toBe("2026-10-20T04:05:00.000Z");
 });
 it("rejects invalid direct-call sizes before allocating unbounded rows",()=>{
  for(const patch of [
   {slotsPerRoom:0},{slotsPerRoom:1000000},{durationMinutes:0},
   {durationMinutes:-1},{gapMinutes:-1},{rooms:[]},
   {rooms:Array.from({length:21},(_,i)=>"Room "+i)},
   {startsAt:"not-a-date"},{startsAt:"2026-10-20T09:00:00"},
  ])expect(()=>planInterviewDay({...input,...patch})).toThrow();
 });
 it("does not treat whitespace/case differences as separate physical rooms",()=>{
  expect(()=>planInterviewDay({...input,rooms:["Hall A"," hall a "]}))
   .toThrow("Room names must be different");
  expect(planInterviewDay({...input,rooms:[" Hall A "],slotsPerRoom:1})[0].room)
   .toBe("Hall A");
  expect(sameInterviewRoom("Room A"," room a ")).toBe(true);
  expect(sameInterviewRoom("Ｒｏｏｍ　Ａ","Room A")).toBe(true);
  expect(sameInterviewRoom("Room B","Room A")).toBe(false);
  expect(()=>planInterviewDay({...input,rooms:null} as unknown as typeof input)).toThrow("Invalid interview day configuration");
 });
 it("TPO-drive-workspace-44 assignment checks Unicode-equivalent occupied rooms before writing",()=>{
  expect(sameInterviewRoom("Ｒｏｏｍ　Ａ"," room a ")).toBe(true);
  expect(sameInterviewRoom("Café Hall","Café Hall")).toBe(true);

  const service=readFileSync("src/modules/placements/tpo-interview-slot-service.ts","utf8");
  const section=service.slice(service.indexOf('if(input.action==="ASSIGN_ROOM")'));
  // A large historical slot inventory must not block an unrelated time window.
  // The DB predicate narrows the bounded normalized-room scan first.
  expect(section).toContain("lt(placementRoundCandidateSlots.startsAt,slot.endsAt)");
  expect(section).toContain("gt(placementRoundCandidateSlots.endsAt,slot.startsAt)");
  expect(section).toContain("overlapsInterviewRoom({...slot,room:input.room},collisions)");
  expect(section).toContain("lt(placementRoundCandidateSlots.startsAt,slot.endsAt)");
  expect(section).toContain("gt(placementRoundCandidateSlots.endsAt,slot.startsAt)");
  expect(section).toContain("collisions.length>1000");
  expect(section).toContain("That room is already in use at this time.");
 });
 it("TPO-drive-workspace-44 uses the same overlap rules in day generation, bulk room edits and slot assignment",()=>{
  const beginning=new Date("2026-10-20T04:00:00.000Z");
  const ending=new Date("2026-10-20T04:30:00.000Z");
  const proposed={room:"Hall A",startsAt:beginning,endsAt:ending};
  expect(overlapsInterviewRoom(proposed,[
   {room:"hall a ",startsAt:new Date("2026-10-20T03:30:00.000Z"),endsAt:beginning},
  ])).toBe(false); // adjacent: no double booking
  expect(overlapsInterviewRoom(proposed,[
   {room:"Ｈａｌｌ　Ａ",startsAt:new Date("2026-10-20T03:59:00.000Z"),endsAt:beginning},
  ])).toBe(false);
  expect(overlapsInterviewRoom(proposed,[
   {room:"Ｈａｌｌ　Ａ",startsAt:new Date("2026-10-20T04:20:00.000Z"),endsAt:new Date("2026-10-20T04:40:00.000Z")},
  ])).toBe(true);
  expect(overlapsInterviewRoom(proposed,[
   {room:"Other room",startsAt:new Date("2026-10-20T04:20:00.000Z"),endsAt:new Date("2026-10-20T04:40:00.000Z")},
  ])).toBe(false);
  expect(overlapsInterviewRoom(proposed,[
   {room:"Hall A",startsAt:new Date("invalid"),endsAt:ending},
  ])).toBe(true);
  expect(overlapsInterviewRoom({...proposed,endsAt:beginning},[])).toBe(true);
  const service=readFileSync("src/modules/placements/tpo-interview-slot-service.ts","utf8");
  expect(service).toContain("proposed.some(p=>overlapsInterviewRoom(p,existing))");
  expect(service).toContain("const conflict=overlapsInterviewRoom({...slot,room:input.room}");
  expect(service).toContain("overlapsInterviewRoom({...slot,room:input.room},collisions)");
 });
 it("rejects slots that run past 23:59 IST instead of silently crossing college days",()=>{
  expect(()=>planInterviewDay({...input,startsAt:"2026-10-20T23:40:00+05:30",durationMinutes:30,slotsPerRoom:1}))
   .toThrow("midnight");
 });
 it("rejects forged confirms, unsupported actions and stale/missing optimistic versions",()=>{
  const valid={action:"BOOK",confirmed:true,slotId:"00000000-0000-4000-8000-000000000001",
   applicationId:"00000000-0000-4000-8000-000000000002",expectedVersion:1};
  expect(tpoInterviewSlotActionSchema.safeParse(valid).success).toBe(true);
  for(const patch of [{confirmed:false},{expectedVersion:0},{expectedVersion:-1},
   {expectedVersion:1.5},{slotId:"other-tenant-string"},{action:"FORCE_BOOK"},
   {unapprovedTenantId:"00000000-0000-4000-8000-000000000003"}])
   expect(tpoInterviewSlotActionSchema.safeParse({...valid,...patch}).success).toBe(false);
 });
 it("fail-closes on invalid requested or persisted venue timing, while permitting exactly touching slots",()=>{
  const proposed=new Date("2026-10-20T04:00:00.000Z");
  const existing=new Date("2026-10-20T03:30:00.000Z");
  expect(overlappingInterviewVenue(proposed,30,[{start:existing,durationMinutes:30}])).toBe(false);
  expect(overlappingInterviewVenue(proposed,30,[{start:existing,durationMinutes:31}])).toBe(true);
  for(const duration of [0,-10,0.5,Number.NaN])
   expect(overlappingInterviewVenue(proposed,duration,[{start:existing,durationMinutes:30}])).toBe(true);
  expect(overlappingInterviewVenue(new Date("invalid"),30,[])).toBe(true);
  expect(overlappingInterviewVenue(proposed,30,[{start:new Date("invalid"),durationMinutes:30}])).toBe(true);
  expect(overlappingInterviewVenue(proposed,30,[{start:existing,durationMinutes:null}])).toBe(true);
  expect(validInterviewWindow(new Date("invalid"),existing,30)).toBe(false);
 });
});
