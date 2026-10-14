import {describe,it,expect} from "vitest";
import {collegeContentCsvSchema,collegeContentCsvHref,renderCollegeContentMetadataCsv,exportParams}
 from "@/modules/courses/college-content-export-model";
describe("college video metadata CSV",()=>{
 it("disallows client college or paging and generates fixed encoded href",()=>{
  expect(collegeContentCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(collegeContentCsvSchema.safeParse({page:3}).success).toBe(false);
  expect(exportParams(new URLSearchParams("q=a&q=b"))).toBeNull();
  const q=collegeContentCsvSchema.parse({format:"VIDEO",scope:"SECTION",q:"A & B"});
  const href=collegeContentCsvHref("VIDEO",q);
  expect(new URL(href,"https://example.test").searchParams.get("q")).toBe("A & B");
  expect(href).toContain("scope=SECTION");
 });
 it("neutralizes metadata and contains no storage identifiers",()=>{
  const csv=renderCollegeContentMetadataCsv([{
   title:"=title",contentType:"VIDEO",status:"PUBLISHED",courseName:"+course",
   courseCode:"CS1",cohortName:"2026",periodName:"Year",lessonName:"Unit",
   learningPathTitle:"Path",deliveryId:null,durationSeconds:120,
  }],true);
  expect(csv).toContain("\"'=title\"");
  expect(csv).toContain("\"'+course\"");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).not.toContain("Storage key");
 });
});
