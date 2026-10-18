import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoStudentMarksVerificationLabel} from "@/modules/placements/tpo-student-marks-label";
import {tpoStudentCsvCell} from "@/modules/placements/tpo-students-csv";

describe("TPO-students-29 missing academic verification truthfulness",()=>{
 it("does not present a missing verification as a rejected academic record",()=>{
  expect(tpoStudentMarksVerificationLabel(null)).toBe("Not recorded");
  expect(tpoStudentMarksVerificationLabel(undefined)).toBe("Not recorded");
 });
 it("keeps explicit verified and unverified outcomes distinct and legacy-readable",()=>{
  expect(tpoStudentMarksVerificationLabel(true)).toBe("Verified");
  expect(tpoStudentMarksVerificationLabel(false)).toBe("Not verified");
  expect(tpoStudentCsvCell(tpoStudentMarksVerificationLabel(null))).toBe('"Not recorded"');
 });
 it("wires the model to the actual authenticated Students roster without inventing a verification decision",()=>{
  const source=readFileSync(new URL("../../src/components/tpo/tpo-students-spreadsheet.tsx",import.meta.url),"utf8");
  expect(source).toContain('{key:"marksVerified",label:"Marks verified",read:row=>tpoStudentMarksVerificationLabel(row.marksVerified)}');
  expect(source).not.toContain('row.marksVerified?"Verified":"Not verified"');
 });
});
