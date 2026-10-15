import {describe,it,expect} from "vitest";
import {offeringMappingCsvSchema,offeringMappingCsvHref,renderOfferingMappingCsv,exportParams}
 from "@/modules/academics/college-mapping-export-model";
describe("college offering mapping export",()=>{
 it("denies client tenant override, page and duplicate filters",()=>{
  expect(offeringMappingCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(offeringMappingCsvSchema.safeParse({page:99}).success).toBe(false);
  expect(offeringMappingCsvSchema.safeParse({type:"WRONG"}).success).toBe(false);
  expect(offeringMappingCsvSchema.safeParse({courseCode:"x".repeat(65)}).success).toBe(false);
  expect(offeringMappingCsvHref({q:"",type:"ALL",status:"ALL",courseCode:"CS-1"})).toContain("courseCode=CS-1");
  expect(exportParams(new URLSearchParams("q=x&q=y"))).toBeNull();
  const url=new URL(offeringMappingCsvHref({q:"Hi & Bye",type:"CORE",status:"ACTIVE"}),"https://example.test");
  expect(url.searchParams.get("q")).toBe("Hi & Bye");
  expect(url.searchParams.get("type")).toBe("CORE");
  expect(url.searchParams.get("status")).toBe("ACTIVE");
 });
 it("neutralizes formulas and reports cap",()=>{
  const csv=renderOfferingMappingCsv([{
   courseName:"=bad",courseCode:"CS-1",programName:"+bad",cohortName:"Batch",
   periodName:"2026",periodCode:"P-1",type:"CORE",credits:null,status:"ACTIVE",
  }],true);
  expect(csv).toContain("\"'=bad\"");
  expect(csv).toContain("\"'+bad\"");
  expect(csv).toContain("EXPORT TRUNCATED");
 });
});
