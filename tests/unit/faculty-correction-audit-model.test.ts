import {describe,expect,it} from "vitest";
import {facultyCorrectionDelta,facultyCorrectionReasonValid}
 from "@/modules/attendance/faculty-correction-audit-model";
describe("Faculty Attendance correction audit model",()=>{
 it("counts actual changed learner statuses without exposing identities",()=>{
  expect(facultyCorrectionDelta(["a","b"],["b","c"]))
   .toEqual({movedToAbsent:1,movedToPresent:1,changed:true});
  expect(facultyCorrectionDelta(["a"],["a"]).changed).toBe(false);
 });
 it("requires a meaningful reason with bounded length",()=>{
  expect(facultyCorrectionReasonValid("Corrected register")).toBe(true);
  expect(facultyCorrectionReasonValid("   ")).toBe(false);
  expect(facultyCorrectionReasonValid("short")).toBe(false);
  expect(facultyCorrectionReasonValid("x".repeat(501))).toBe(false);
 });
});
