import {describe,expect,it} from "vitest";
import {hrNextCalendarEvent} from "@/modules/placements/hr-calendar-next-event-model";
const now=new Date("2026-10-15T10:00:00Z");
const rounds=[{kind:"ROUND",title:"Panel",startsAt:new Date("2026-10-15T12:00:00Z")},
 {kind:"APPLICATION_DEADLINE",title:"Apply",startsAt:new Date("2026-10-15T15:00:00Z")}];
const due=[{roundName:"Technical",dueAt:new Date("2026-10-15T11:00:00Z")}];
describe("HR next visible calendar event",()=>{
 it("chooses earliest authorized future event including results due",()=>{
  expect(hrNextCalendarEvent(rounds,due,"ALL",now)?.title).toBe("Results due: Technical");
  expect(hrNextCalendarEvent(rounds,due,"ROUNDS",now)?.title).toBe("Panel");
  expect(hrNextCalendarEvent(rounds,due,"DEADLINES",now)?.title).toBe("Apply");
  expect(hrNextCalendarEvent(rounds,due,"RESULTS_DUE",now)?.at).toEqual(due[0]!.dueAt);
 });
 it("rejects historical or unsupported events",()=>{
  expect(hrNextCalendarEvent([{kind:"SLOT",title:"Not registered",startsAt:new Date("2026-10-15T11:00:00Z")}],[],"ALL",now)).toBeNull();
  expect(hrNextCalendarEvent(rounds,due,"ALL",new Date("2026-10-17T00:00:00Z"))).toBeNull();
 });
});
