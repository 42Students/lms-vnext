import { describe,it,expect } from "vitest";
import { learnerScheduleDayAfterShift } from "@/modules/academics/learner-schedule-shift-day-model";
describe("learner Class Schedule navigation",()=>{
  const anchor=new Date(2026,9,22);
  it("keeps selected agenda day in a new Week or Day window",()=>{
    expect(learnerScheduleDayAfterShift(anchor,"week")).toBe("2026-10-22");
    expect(learnerScheduleDayAfterShift(anchor,"day")).toBe("2026-10-22");
  });
  it("uses first day on month transition",()=>expect(learnerScheduleDayAfterShift(anchor,"month")).toBe("2026-10-01"));
});
