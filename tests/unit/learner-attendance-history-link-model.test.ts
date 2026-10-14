import {describe,expect,it} from "vitest";
import {learnerAttendanceCourseHistoryHref} from "@/modules/attendance/learner-attendance-history-link-model";
const id="11111111-1111-4111-8111-111111111111";
describe("learner Attendance per-course history",()=>{
 it("links to the exact selected course's canonical authorized drilldown",()=>{
  expect(learnerAttendanceCourseHistoryHref(id,"2026-10"))
   .toBe("/learn/courses/"+id+"/attendance-summary?month=2026-10");
 });
 it("rejects malformed delivery IDs and drops invalid date parameters",()=>{
  expect(learnerAttendanceCourseHistoryHref("../foreign","2026-10")).toBeNull();
  expect(learnerAttendanceCourseHistoryHref(id,"2026-99"))
   .toBe("/learn/courses/"+id+"/attendance-summary");
 });
});
