import {describe,it,expect} from "vitest";
import {facultyAssignmentCsvSchema,facultyAssignmentCsvHref,renderFacultyAssignmentCsv,exportParams}
 from "@/modules/academics/college-faculty-assignment-export-model";
describe("college teaching roster export",()=>{
 it("allows only validated roles and filters, never arbitrary tenant/page",()=>{
  expect(facultyAssignmentCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(facultyAssignmentCsvSchema.safeParse({page:10}).success).toBe(false);
  expect(facultyAssignmentCsvSchema.safeParse({role:"OWNER"}).success).toBe(false);
  expect(exportParams(new URLSearchParams("status=ALL&status=ENDED"))).toBeNull();
  expect(facultyAssignmentCsvHref({q:"",role:"TA",status:"ACTIVE"})).toContain("role=TA");
 });
 it("escapes dangerous names and labels timestamps explicitly",()=>{
  const csv=renderFacultyAssignmentCsv([{
   facultyName:"=malicious",role:"PRIMARY",courseName:"+course",courseCode:"C1",
   sectionName:"A",cohortName:"B",periodName:"2026",state:"ACTIVE",
   startedAt:new Date("2026-10-15T00:00:00.000Z"),endedAt:null,
  }],true);
  expect(csv).toContain("\"'=malicious\"");
  expect(csv).toContain("\"'+course\"");
  expect(csv).toContain("Started at (UTC)");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).not.toContain("Email");
 });
});
