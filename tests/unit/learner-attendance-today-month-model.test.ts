import {describe,expect,it} from "vitest";
import {learnerAttendanceCanReturnToMonth} from "@/modules/attendance/learner-attendance-today-month-model";
describe("learner Attendance return to current month",()=>{
 it("shows the shortcut only while browsing a different valid month",()=>{
  expect(learnerAttendanceCanReturnToMonth("2026-09","2026-10")).toBe(true);
  expect(learnerAttendanceCanReturnToMonth("2026-10","2026-10")).toBe(false);
  expect(learnerAttendanceCanReturnToMonth("2026-99","2026-10")).toBe(false);
 });
});
