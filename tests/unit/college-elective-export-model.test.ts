import {describe,it,expect} from "vitest";
import {electiveCsvSchema,electiveCsvHref,renderElectivesCsv,exportParams}
 from "@/modules/academics/college-elective-export-model";
describe("college electives CSV",()=>{
 it("parses only college-independent bounded filters",()=>{
  expect(electiveCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(electiveCsvSchema.safeParse({page:6}).success).toBe(false);
  expect(electiveCsvSchema.safeParse({semesterNumber:25}).success).toBe(false);
  expect(electiveCsvSchema.safeParse({maximumCredits:0}).success).toBe(false);
  expect(electiveCsvSchema.safeParse({minimumCredits:9,maximumCredits:8}).success).toBe(false);
  expect(electiveCsvSchema.parse({maximumCredits:8}).maximumCredits).toBe(8);
  expect(electiveCsvHref({q:"",status:"ACTIVE",maximumCredits:8})).toContain("maximumCredits=8");
  expect(exportParams(new URLSearchParams("q=a&q=b"))).toBeNull();
  expect(electiveCsvHref({q:"",status:"ACTIVE",semesterNumber:3})).toContain("semesterNumber=3");
 });
 it("neutralizes CSV injection and shows true configured picks",()=>{
  const csv=renderElectivesCsv([{
   name:"=slot",programName:"-danger",semesterNumber:1,academicYear:null,
   periodName:null,credits:3,minPick:1,maxPick:2,activeOfferings:0,status:"ACTIVE",
  }],true);
  expect(csv).toContain("\"'=slot\"");
  expect(csv).toContain("\"'-danger\"");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain("Minimum picks");
 });
});
