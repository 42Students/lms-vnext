import {describe,expect,it} from "vitest";
import {facultyAttendanceWriteNeedsReload} from "../../src/modules/attendance/faculty-attendance-write-recovery";

describe("Faculty attendance unknown-write recovery",()=>{
 it("locks stale, timed-out, and server-error writes pending roster readback",()=>{
  for(const status of [null,408,409,412,500,502,503,504])
   expect(facultyAttendanceWriteNeedsReload(status)).toBe(true);
 });
 it("does not invent a successful write or lock validated client denials",()=>{
  for(const status of [400,401,403,404,422,429])
   expect(facultyAttendanceWriteNeedsReload(status)).toBe(false);
 });
});
