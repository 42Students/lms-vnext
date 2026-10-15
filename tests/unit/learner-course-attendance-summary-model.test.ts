import {describe,expect,it} from "vitest";
import {learnerCourseAttendanceSummary,learnerCourseAttendanceThresholdReached} from "@/modules/attendance/learner-course-attendance-summary-model";
describe("learner Course Attendance marked-status accuracy",()=>{
 it("does not call excused, medical or late sessions explicitly absent",()=>{
  const data=learnerCourseAttendanceSummary(["PRESENT","ABSENT","EXCUSED","MEDICAL","LATE","NOT_MARKED","SCHEDULED"].map(status=>({status:status as "PRESENT"|"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE"|"NOT_MARKED"|"SCHEDULED"})));
  expect(data).toMatchObject({present:1,absent:1,otherMarked:3,markedSessions:5,unmarkedSessions:1,percentage:20});
 });
 it("compares exact threshold without accepting rounded-up just-below percentages",()=>{
  expect(learnerCourseAttendanceThresholdReached(2,3,67)).toBe(false);
  expect(learnerCourseAttendanceThresholdReached(2,3,66)).toBe(true);
  expect(learnerCourseAttendanceThresholdReached(0,0,0)).toBe(false);
 });
});
