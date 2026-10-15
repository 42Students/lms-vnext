import {describe,it,expect} from "vitest";
import {collegeProgressCsvSchema,collegeProgressCsvHref,renderCollegeProgressCsv,exportParams}
 from "@/modules/courses/college-progress-export-model";
describe("college recorded course activity CSV",()=>{
 it("accepts only current-college derived scopes and bounded search",()=>{
  expect(collegeProgressCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(collegeProgressCsvSchema.safeParse({page:2}).success).toBe(false);
  expect(exportParams(new URLSearchParams("q=a&q=b"))).toBeNull();
  expect(collegeProgressCsvHref({q:"A & B",status:"ARCHIVED"})).toContain("status=ARCHIVED");
 });
 it("labels only observed metrics and escapes spreadsheet formulas",()=>{
  const csv=renderCollegeProgressCsv([{
   courseName:"=course",courseCode:"+code",cohortName:"2026",periodName:"Year",
   offeringStatus:"ACTIVE",recordedRows:0,completedRows:0,learnersWithRecords:0,
  }],true);
  expect(csv).toContain("\"'=course\"");
  expect(csv).toContain("\"'+code\"");
  expect(csv).toContain("Distinct learners with records");
  expect(csv).not.toContain("Completion rate");
  expect(csv).toContain("EXPORT TRUNCATED");
 });
 it("course progress programStatus is validated before CSV export",()=>{
    expect(collegeProgressCsvSchema.safeParse({programStatus:"BAD"}).success).toBe(false);
    expect(collegeProgressCsvHref(collegeProgressCsvSchema.parse({programStatus:"ACTIVE"}))).toContain("programStatus=ACTIVE");
 });

 it("course progress cohortStatus is validated before CSV export",()=>{
    expect(collegeProgressCsvSchema.safeParse({cohortStatus:"BAD"}).success).toBe(false);
    expect(collegeProgressCsvHref(collegeProgressCsvSchema.parse({cohortStatus:"PLANNED"}))).toContain("cohortStatus=PLANNED");
 });

 it("progress CSV retains valid periodStatus",()=>{
    expect(collegeProgressCsvSchema.safeParse({periodStatus:"BAD"}).success).toBe(false);
    expect(collegeProgressCsvHref(collegeProgressCsvSchema.parse({periodStatus:"PLANNED"}))).toContain("periodStatus=PLANNED");
 });

});
