import {describe,it,expect} from "vitest";
import {learnerScheduleClock} from "@/modules/academics/learner-schedule-clock-model";
describe("learner schedule consistent clock",()=>{
  it("retains the exact server-independent clock snapshot",()=>{
    const now=Date.parse("2026-10-15T18:30:00+05:30");
    expect(learnerScheduleClock(now).toISOString()).toBe("2026-10-15T13:00:00.000Z");
    expect(learnerScheduleClock(now).getTime()).toBe(now);
  });
  it("rejects invalid clocks rather than misclassifying sessions",()=>{
    for(const value of [Number.NaN,Number.POSITIVE_INFINITY,-1])expect(()=>learnerScheduleClock(value)).toThrow();
  });
});
