import {describe,expect,it} from "vitest";
import {attendanceParentSmsCurrentStateEligible as eligible}
  from "@/modules/attendance/parent-sms-current-state";

describe("DB06 parent SMS current-state fail-closed eligibility",()=>{
 it("can deliver a queued correction for retained explicit PRESENT history rows",()=>{
  expect(eligible("CORRECTED","PRESENT")).toBe(true);
  // Pre-DB06 legacy exceptions physically disappeared when corrected.
  expect(eligible("CORRECTED",undefined)).toBe(true);
  expect(eligible("CORRECTED",null)).toBe(true);
 });
 it("skips outdated correction if the learner is now absent or has another code",()=>{
  for(const status of ["ABSENT","EXCUSED","MEDICAL","LATE","UNRECOGNIZED"]){
   expect(eligible("CORRECTED",status)).toBe(false);
  }
 });
 it("sends absence notifications only while learner is explicitly ABSENT",()=>{
  expect(eligible("ABSENT","ABSENT")).toBe(true);
  for(const status of ["PRESENT","EXCUSED","MEDICAL","LATE",undefined,null]){
   expect(eligible("ABSENT",status)).toBe(false);
  }
 });
 it("rejects unknown notification kinds instead of sending",()=>{
  expect(eligible("OTHER" as "ABSENT","PRESENT")).toBe(false);
 });
});
