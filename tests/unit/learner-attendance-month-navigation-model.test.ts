import {describe,it,expect} from "vitest";
import {parseMonth,monthKey,shiftMonth} from "@/modules/attendance/learner-attendance-month-navigation-model";
describe("learner Attendance timezone-neutral month browsing",()=>{
 it("crosses year boundaries without a local timezone dependency",()=>{
  expect(monthKey(shiftMonth(parseMonth("2026-12"),1))).toBe("2027-01");
  expect(monthKey(shiftMonth(parseMonth("2027-01"),-1))).toBe("2026-12");
 });
 it("treats a month as an exact date-only input",()=>{
  expect(parseMonth("2026-10").toISOString()).toBe("2026-10-01T12:00:00.000Z");
  expect(()=>parseMonth("2026-13")).toThrow();
 });
});
