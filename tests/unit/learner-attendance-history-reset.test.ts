import {describe,it,expect} from "vitest";
import {learnerAttendanceHistoryResetHref} from "@/modules/attendance/learner-attendance-history-reset-model";
const id="00000000-0000-4000-8000-000000000001";
describe("learner Attendance history reset",()=>{
 it("preserves current authorized delivery and month without stale history selectors",()=>{
  expect(learnerAttendanceHistoryResetHref(id,"2026-10")).toBe("/learn/attendance?deliveryId="+id+"&month=2026-10");
 });
 it("rejects invalid course ids or months",()=>{
  expect(()=>learnerAttendanceHistoryResetHref("forged","2026-10")).toThrow();
  expect(()=>learnerAttendanceHistoryResetHref(id,"2026-13")).toThrow();
 });
});
