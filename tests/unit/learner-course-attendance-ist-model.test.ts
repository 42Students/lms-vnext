import {describe,expect,it} from "vitest";
import {learnerCourseAttendanceIstMonth,learnerCourseAttendanceSameIstMonth} from "@/modules/attendance/learner-course-attendance-ist-model";
describe("course attendance IST month grouping",()=>{
 it("includes a late September UTC session in October IST",()=>{
  const session=new Date("2026-09-30T21:00:00Z");
  expect(learnerCourseAttendanceIstMonth(session)).toBe("2026-10");
  expect(learnerCourseAttendanceSameIstMonth(session,"2026-10")).toBe(true);
  expect(learnerCourseAttendanceSameIstMonth(session,"2026-09")).toBe(false);
 });
});
