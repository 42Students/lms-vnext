import {describe,expect,it} from "vitest";
import {facultyAttendanceCorrectionTokenMatches,facultyAttendanceNextMarkedAt}
 from "@/modules/attendance/faculty-correction-token-model";
describe("Faculty Attendance optimistic correction",()=>{
 it("allows first mark without a token but requires current token on re-mark",()=>{
  const now=new Date("2026-10-14T12:00:00.100Z");
  expect(facultyAttendanceCorrectionTokenMatches(null,null,undefined)).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",now,undefined)).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",now,now.toISOString())).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",now,"2026-10-14T12:00:00.099Z")).toBe(false);
 });
 it("monotonically increments the persisted mark version",()=>{
  const stamp=new Date("2026-10-14T12:00:00.100Z");
  expect(facultyAttendanceNextMarkedAt(stamp,stamp).toISOString()).toBe("2026-10-14T12:00:00.101Z");
 });
});
