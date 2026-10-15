import { describe,it,expect } from "vitest";
import { learnerScheduleAnchorForView } from "@/modules/academics/learner-schedule-view-anchor-model";
describe("learner Class Schedule view switches",()=>{
  it("uses the selected IST abstract calendar date as the new anchor",()=>{
    const anchor=learnerScheduleAnchorForView("2026-10-24",new Date(2026,9,1));
    expect([anchor.getFullYear(),anchor.getMonth()+1,anchor.getDate()]).toEqual([2026,10,24]);
  });
  it("keeps existing anchor for an unexpected invalid internal date",()=>{
    const old=new Date(2026,9,1);
    expect(learnerScheduleAnchorForView("broken",old)).toBe(old);
  });
});
