import {describe,it,expect} from "vitest";
import {learnerScheduleTodayDay} from "@/modules/academics/learner-schedule-today-day-model";
describe("learner schedule Today calendar-mode dates",()=>{
  it("uses the stable IST date for learner schedules",()=>{
    expect(learnerScheduleTodayDay(new Date("2026-10-14T20:00:00Z"),"IST")).toBe("2026-10-15");
  });
  it("uses local calendar components for local-mode calendars",()=>{
    const d=new Date(2026,9,14,23,30);
    expect(learnerScheduleTodayDay(d,"LOCAL")).toBe("2026-10-14");
  });
});
