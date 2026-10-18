import { describe, expect, it } from "vitest";
import { planInterviewDay, tpoInterviewSlotActionSchema } from "@/modules/placements/tpo-interview-slot-model";
import { hrInterviewSlotCreateSchema, hrInterviewSlotActionSchema, slotTransitionAllowed, slotsOverlap, parseIstLocalSlot, canRecruiterMutateOwnSlot } from "@/modules/placements/hr-interview-slot-model";

const uuid = "00000000-0000-4000-8000-000000000001";
const uuid2 = "00000000-0000-4000-8000-000000000002";

describe("TPO-drive-workspace-44 / REC-home-drives-48 slot mutation ledger", () => {
 it("generates deterministic slots for multiple rooms with the requested gap", () => {
  const slots=planInterviewDay({startsAt:"2026-10-20T03:30:00Z",durationMinutes:30,gapMinutes:10,slotsPerRoom:2,rooms:["A","B"]});
  expect(slots).toHaveLength(4);
  expect(slots.map(slot=>slot.room)).toEqual(["A","A","B","B"]);
  expect(slots[0]?.startsAt.toISOString()).toBe("2026-10-20T03:30:00.000Z");
  expect(slots[1]?.startsAt.toISOString()).toBe("2026-10-20T04:10:00.000Z");
  expect(slots[0]?.endsAt.toISOString()).toBe("2026-10-20T04:00:00.000Z");
 });
 it("refuses duplicate room identifiers even when case differs", () => {
  expect(()=>planInterviewDay({startsAt:"2026-10-20T03:30:00Z",durationMinutes:30,gapMinutes:0,slotsPerRoom:1,rooms:["Room A","room a"]})).toThrow("Room names must be different");
 });
 it("refuses slot schedules crossing IST midnight", () => {
  expect(()=>planInterviewDay({startsAt:"2026-10-20T18:20:00Z",durationMinutes:30,gapMinutes:0,slotsPerRoom:1,rooms:["A"]})).toThrow("midnight");
 });
 it("requires confirmed and CAS-versioned booking, move and cancellation", () => {
  const book={action:"BOOK",confirmed:true,slotId:uuid,applicationId:uuid2,expectedVersion:1};
  expect(tpoInterviewSlotActionSchema.safeParse(book).success).toBe(true);
  expect(tpoInterviewSlotActionSchema.safeParse({...book,expectedVersion:0}).success).toBe(false);
  expect(tpoInterviewSlotActionSchema.safeParse({...book,confirmed:false}).success).toBe(false);
  expect(tpoInterviewSlotActionSchema.safeParse({...book,crossCollegeId:uuid}).success).toBe(false);
  const move={action:"MOVE",confirmed:true,slotId:uuid,targetSlotId:uuid2,expectedVersion:3,reason:"Schedule clash"};
  expect(tpoInterviewSlotActionSchema.safeParse(move).success).toBe(true);
  expect(tpoInterviewSlotActionSchema.safeParse({...move,reason:"x"}).success).toBe(false);
 });
 it("caps generation and requires explicit room assignment reasons", () => {
  expect(tpoInterviewSlotActionSchema.safeParse({action:"GENERATE_DAY",confirmed:true,startsAt:"2026-10-20T09:00:00+05:30",durationMinutes:30,gapMinutes:5,slotsPerRoom:101,rooms:["A"]}).success).toBe(false);
  expect(tpoInterviewSlotActionSchema.safeParse({action:"ASSIGN_ROOM",confirmed:true,slotId:uuid,expectedVersion:1,room:"Interview Hall"}).success).toBe(true);
  expect(tpoInterviewSlotActionSchema.safeParse({action:"ASSIGN_ROOM",confirmed:true,slotId:uuid,expectedVersion:1,room:"   "}).success).toBe(false);
 });
 it("validates HR slots against IST timezone, positive duration, and capacity bounds", () => {
  const value={roundId:uuid,startAt:"2026-10-20T09:00:00+05:30",endAt:"2026-10-20T09:30:00+05:30",timezone:"Asia/Kolkata",mode:"ON_CAMPUS",capacity:"2"};
  const parsed=hrInterviewSlotCreateSchema.safeParse(value);
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(parsed.data.capacity).toBe(2);
  expect(hrInterviewSlotCreateSchema.safeParse({...value,capacity:101}).success).toBe(false);
  expect(hrInterviewSlotCreateSchema.safeParse({...value,timezone:"UTC"}).success).toBe(false);
  expect(hrInterviewSlotCreateSchema.safeParse({...value,endAt:value.startAt}).success).toBe(false);
  expect(hrInterviewSlotCreateSchema.safeParse({...value,endAt:"2026-10-20T19:00:00+05:30"}).success).toBe(false);
 });
 it("enforces HR status transitions, available capacity and optimistic versions", () => {
  expect(slotTransitionAllowed("PROPOSED","OFFER")).toBe(true);
  expect(slotTransitionAllowed("PROPOSED","BOOK")).toBe(false);
  expect(slotTransitionAllowed("OFFERED","BOOK",1,2)).toBe(true);
  expect(slotTransitionAllowed("OFFERED","BOOK",2,2)).toBe(false);
  expect(slotTransitionAllowed("BOOKED","BOOK",1,2)).toBe(true);
  expect(slotTransitionAllowed("BOOKED","OFFER")).toBe(false);
  expect(slotTransitionAllowed("OFFERED","BOOK",-1,2)).toBe(false);
  expect(hrInterviewSlotActionSchema.safeParse({slotId:uuid,expectedVersion:0,action:"BOOK"}).success).toBe(false);
 });
 it("treats malformed overlap windows as unsafe and touching windows as non-overlapping", () => {
  const a={startAt:new Date("2026-10-20T03:30:00Z"),endAt:new Date("2026-10-20T04:00:00Z")};
  expect(slotsOverlap(a,{startAt:new Date("2026-10-20T04:00:00Z"),endAt:new Date("2026-10-20T04:30:00Z")})).toBe(false);
  expect(slotsOverlap(a,{startAt:new Date("2026-10-20T03:59:00Z"),endAt:new Date("2026-10-20T04:30:00Z")})).toBe(true);
  expect(slotsOverlap(a,{startAt:new Date("invalid"),endAt:new Date("2026-10-20T04:30:00Z")})).toBe(true);
 });
 it("parses actual calendar-valid local IST times and rejects invalid dates", () => {
  expect(parseIstLocalSlot("2026-10-20T09:30")).toBe("2026-10-20T09:30:00+05:30");
  expect(()=>parseIstLocalSlot("2026-02-30T09:30")).toThrow("INVALID_IST_DATE");
  expect(()=>parseIstLocalSlot("2026-10-20T09:30Z")).toThrow();
 });
 it("permits only the recruiter who created the slot to mutate it", () => {
  expect(canRecruiterMutateOwnSlot("owner","owner")).toBe(true);
  expect(canRecruiterMutateOwnSlot("owner","other")).toBe(false);
  expect(canRecruiterMutateOwnSlot("","")).toBe(false);
 });
});
