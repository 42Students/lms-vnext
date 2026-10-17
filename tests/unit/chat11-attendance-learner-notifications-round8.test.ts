import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { facultyAttendanceChangedMemberships } from "@/modules/attendance/faculty-correction-audit-model";
const file=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Attendance targeted notification transitions",()=>{
 it("FAC-attendance-grades-01 only notifies learners whose absent/present state changed",()=>{
  expect(facultyAttendanceChangedMemberships([],["a","b"]))
   .toEqual({newlyAbsent:["a","b"],correctedPresent:[]});
  expect(facultyAttendanceChangedMemberships(["a","b"],["b","c"]))
   .toEqual({newlyAbsent:["c"],correctedPresent:["a"]});
  expect(facultyAttendanceChangedMemberships(["a"],["a"]))
   .toEqual({newlyAbsent:[],correctedPresent:[]});
  const src=file("src/modules/attendance/faculty-service.ts");
  expect(src).toContain("deliverInAppNotificationInTransaction(tx,activity.id");
  expect(src).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(src).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(src).toContain("Class attendance marked absent");
  expect(src).toContain("Class attendance corrected");
  expect(src).not.toContain("sendOtp(phone");
 });
});
