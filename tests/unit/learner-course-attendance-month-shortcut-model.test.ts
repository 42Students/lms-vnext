import {describe,expect,it} from "vitest";
import {learnerCourseAttendanceMonthShortcutVisible} from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
describe("Course Attendance return to this month",()=>{
 it("offers shortcut from earlier valid month only",()=>{
  expect(learnerCourseAttendanceMonthShortcutVisible("2026-08","2026-10")).toBe(true);
  expect(learnerCourseAttendanceMonthShortcutVisible("2026-10","2026-10")).toBe(false);
  expect(learnerCourseAttendanceMonthShortcutVisible("2026-15","2026-10")).toBe(false);
 });
});
