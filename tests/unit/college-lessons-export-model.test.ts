import {describe,it,expect} from "vitest";
import {lessonsCsvSchema,lessonsCsvHref,renderLessonsCsv,exportParams}
 from "@/modules/courses/college-lessons-export-model";
describe("college lessons CSV",()=>{
 it("strictly preserves authorized filter state and refuses page/college",()=>{
  expect(lessonsCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(lessonsCsvSchema.safeParse({page:3}).success).toBe(false);
  expect(lessonsCsvSchema.safeParse({programCode:"x".repeat(65)}).success).toBe(false);
  expect(lessonsCsvSchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
  expect(lessonsCsvHref({...lessonsCsvSchema.parse({periodCode:"2026-Q4"})})).toContain("periodCode=2026-Q4");
  expect(lessonsCsvHref({...lessonsCsvSchema.parse({programCode:"PROG-1"})})).toContain("programCode=PROG-1");
  expect(lessonsCsvSchema.safeParse({offeringStatus:"CLOSED"}).success).toBe(false);
  expect(exportParams(new URLSearchParams("q=a&q=b"))).toBeNull();
  expect(lessonsCsvHref({q:"A & B",status:"ACTIVE",offeringStatus:"ARCHIVED"}))
   .toContain("offeringStatus=ARCHIVED");
 });
 it("CSV neutralizes metadata formulas and does not infer completion",()=>{
  const csv=renderLessonsCsv([{
   name:"=lesson",sequence:0,status:"ACTIVE",pathStatus:"PUBLISHED",
   courseName:"+course",courseCode:"CS-1",cohortName:"2026",periodName:"Year",
   offeringStatus:"ACTIVE",contentCount:2,publishedContentCount:1,
  }],true);
  expect(csv).toContain("\"'=lesson\"");
  expect(csv).toContain("\"'+course\"");
  expect(csv).toContain("Published content");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).not.toContain("completion rate");
 });
});
