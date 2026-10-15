import {describe,expect,it} from "vitest";
import {learnerCourseAttendanceTone} from "@/modules/attendance/learner-course-attendance-tone-model";
describe("Course Attendance exception tone",()=>{
 it("distinguishes an actual absence from recorded exceptions",()=>{
  expect(learnerCourseAttendanceTone("ABSENT")).toBe("error");
  expect(learnerCourseAttendanceTone("MEDICAL")).toBe("neutral");
  expect(learnerCourseAttendanceTone("EXCUSED")).toBe("neutral");
  expect(learnerCourseAttendanceTone("LATE")).toBe("warning");
 });
 it("does not turn unknown status into a fabricated absence",()=>{
  expect(learnerCourseAttendanceTone("UNKNOWN")).toBe("neutral");
 });
});
