import {describe,it,expect} from "vitest";
import {learnerAttendanceDateLabel,learnerAttendanceTimeLabel} from "@/modules/attendance/learner-attendance-display-date-model";
describe("learner Attendance desktop and mobile timestamps",()=>{
 it("does not crash on malformed stored instants",()=>{
  expect(learnerAttendanceDateLabel("invalid")).toBe("Date unavailable");
  expect(learnerAttendanceTimeLabel("invalid")).toBe("Time unavailable");
 });
 it("retains India local time regardless of browser timezone",()=>{
  expect(learnerAttendanceDateLabel("2026-10-15T23:30:00Z")).toContain("16");
  expect(learnerAttendanceTimeLabel("2026-10-15T23:30:00Z")).toMatch(/5:00/);
 });
});
