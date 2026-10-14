import {describe,expect,it} from "vitest";
import {facultyCorrectionDelta,facultyCorrectionReasonValid,facultyAttendanceConfirmation}
 from "@/modules/attendance/faculty-correction-audit-model";
describe("Faculty Attendance correction audit model",()=>{
 it("counts actual changed learner statuses without exposing identities",()=>{
  expect(facultyCorrectionDelta(["a","b"],["b","c"]))
   .toEqual({movedToAbsent:1,movedToPresent:1,changed:true});
  expect(facultyCorrectionDelta(["a"],["a"]).changed).toBe(false);
 });
 it("previews only count changes, and blocks no-op corrections", () => {
  const preview=facultyAttendanceConfirmation(true,["private-a","private-b"],["private-b","private-c"],3);
  expect(preview).toContain("1 changed to absent, 1 changed to present");
  expect(preview).not.toContain("private-");
  expect(facultyAttendanceConfirmation(true,["a","b"],["b","a","a"],2)).toBeNull();
  expect(facultyAttendanceConfirmation(false,[],["a","a"],3)).toBe("Confirm attendance: 2 present, 1 absent.");
  expect(facultyAttendanceConfirmation(false,[],[],0)).toBeNull();
  expect(facultyAttendanceConfirmation(false,[],["a","b"],1)).toBeNull();
 });
 it("requires a meaningful reason with bounded length",()=>{
  expect(facultyCorrectionReasonValid("Corrected register")).toBe(true);
  expect(facultyCorrectionReasonValid("   ")).toBe(false);
  expect(facultyCorrectionReasonValid("short")).toBe(false);
  expect(facultyCorrectionReasonValid("x".repeat(501))).toBe(false);
 });
});
