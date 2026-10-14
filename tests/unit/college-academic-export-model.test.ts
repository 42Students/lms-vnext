import {describe,it,expect} from "vitest";
import {academicExportHref,semesterCsvSchema,renderSemesterCsv,exportParams}
 from "@/modules/academics/college-academic-export-model";
describe("college semester CSV",()=>{
 it("never accepts arbitrary college/page and rejects duplicate query keys",()=>{
  expect(semesterCsvSchema.safeParse({collegeId:"forged"}).success).toBe(false);
  expect(semesterCsvSchema.safeParse({page:2}).success).toBe(false);
  expect(exportParams(new URLSearchParams("q=a&q=b"))).toBeNull();
  expect(new URL(academicExportHref("SEMESTERS",{q:"a & b",status:"ALL",termNumber:2}),"https://example.test").searchParams.get("q")).toBe("a & b");
 });
 it("escapes formula cells and discloses truncation",()=>{
  const csv=renderSemesterCsv([{name:"=HYPERLINK(1)",termNumber:2,programName:"Prog, \"X\"",programCode:"+bad",totalCredits:null,isActive:true,mappedCourses:0}],true);
  expect(csv.startsWith("\ufeff")).toBe(true);
  expect(csv).toContain("\"'=HYPERLINK(1)\"");
  expect(csv).toContain("\"'+bad\"");
  expect(csv).toContain("EXPORT TRUNCATED");
 });
});
