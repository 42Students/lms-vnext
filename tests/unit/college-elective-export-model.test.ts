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
 it("periodState is applied to electives CSV",()=>{
  expect(electiveCsvSchema.safeParse({periodState:"INVALID"}).success).toBe(false);
  expect(electiveCsvHref({q:"",status:"ACTIVE",periodState:"LINKED"})).toContain("periodState=LINKED");
 });

 it("elective CSV filters actual parent program lifecycle",()=>{
    expect(electiveCsvSchema.safeParse({programStatus:"INACTIVE"}).success).toBe(false);
    expect(electiveCsvHref({q:"",status:"ACTIVE",programStatus:"ACTIVE"})).toContain("programStatus=ACTIVE");
 });

 it("choiceMode is retained in scoped elective CSV filters",()=>{
    expect(electiveCsvSchema.safeParse({choiceMode:"ASSUMED"}).success).toBe(false);
    expect(electiveCsvHref({q:"",status:"ACTIVE",choiceMode:"FIXED"})).toContain("choiceMode=FIXED");
 });

 it("offeringState is retained in scoped elective CSV filters",()=>{
    expect(electiveCsvSchema.safeParse({offeringState:"ASSUMED"}).success).toBe(false);
    expect(electiveCsvHref({q:"",status:"ACTIVE",offeringState:"NONE_ACTIVE"})).toContain("offeringState=NONE_ACTIVE");
 });

 it("academicYearState is retained by formula-safe elective CSV",()=>{
    expect(electiveCsvSchema.safeParse({academicYearState:"PREDICTED"}).success).toBe(false);
    expect(electiveCsvHref({q:"",status:"ACTIVE",academicYearState:"RECORDED"})).toContain("academicYearState=RECORDED");
 });

 it("elective periodCode cannot select foreign college or bypass CSV validation",()=>{
    expect(electiveCsvSchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(electiveCsvHref({q:"",status:"ACTIVE",periodCode:"P&26"})).toContain("periodCode=P%2626");
  });

});
