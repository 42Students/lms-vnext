import {describe,expect,it} from "vitest";
import {buildSuperAdminReadinessCsv} from "@/modules/colleges/admin-readiness-export-model";
import type {CollegeReadinessEvaluation} from "@/modules/colleges/readiness-model";
const evaluation:CollegeReadinessEvaluation={overall:"NOT_READY",counts:{total:1,passed:0,failed:1,unknown:0},
 checks:[{id:"COLLEGE_ACTIVE",label:"Active",status:"FAIL",evidence:"=bad",remediation:'Check "archive" state'}]};
describe("Super Admin readiness CSV",()=>{
 it("does not turn spreadsheet text into formulas or claim launch clearance",()=>{
  const csv=buildSuperAdminReadinessCsv({name:"+Campus",code:"AB"},evaluation);
  expect(csv).toContain("'+Campus");
  expect(csv).toContain("'=bad");
  expect(csv).toContain('Check ""archive"" state');
  expect(csv).toContain(String.fromCharCode(13,10));
  expect(csv).not.toContain("READY TO LAUNCH");
 });
});
