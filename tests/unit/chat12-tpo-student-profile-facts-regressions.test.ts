import {describe,expect,it} from "vitest";
import {tpoStudentProfileFacts} from "@/modules/placements/tpo-student-profile-facts";

describe("TPO-students-29 private roster profile provenance and data safety",()=>{
 it("resolves valid leap-day birth year without inventing DOB from impossible dates",()=>{
  expect(tpoStudentProfileFacts({personalDetails:{dateOfBirth:"2000-02-29"}}).birthYear).toBe(2000);
  for(const invalid of ["2001-02-29","2000-04-31","1999-13-01","tomorrow",""]){
   expect(tpoStudentProfileFacts({personalDetails:{dateOfBirth:invalid}}).birthYear).toBeNull();
  }
  expect(tpoStudentProfileFacts({personalDetails:{dateOfBirth:"2001-01-01"}}).birthYear).toBe(2001);
 });
 it("treats finite numeric or bounded decimal PG percentages as facts but rejects invalid grades",()=>{
  const person=(percentage:unknown)=>tpoStudentProfileFacts({
   education:[{educationType:"POSTGRADUATE",degree:"M.Tech",percentage}],
  });
  expect(person(82.75).pgPercentage).toBe(82.75);
  expect(person("82.75").pgPercentage).toBe(82.75);
  expect(person("100.00").pgPercentage).toBe(100);
  for(const invalid of ["101","-1","NaN","85.123",Infinity,NaN]){
   expect(person(invalid).pgPercentage).toBeNull();
  }
  expect(person("85.00").degree).toBe("M.Tech");
 });
 it("never counts a bogus array or empty object as a resume but recognizes real document evidence",()=>{
  expect(tpoStudentProfileFacts({resume:[]}).resume).toBe(false);
  expect(tpoStudentProfileFacts({resume:{}}).resume).toBe(false);
  expect(tpoStudentProfileFacts({resumeDocumentId:"recorded-id"}).resume).toBe(true);
  expect(tpoStudentProfileFacts({resumeUrl:"https://example.edu/resume"}).resume).toBe(true);
 });
 it("does not expose full telephone or unsafe social URLs to the placement roster",()=>{
  const facts=tpoStudentProfileFacts({
   personalDetails:{gender:"Female"},
   contactDetails:{mobileNumber:"+91 9876543210"},
   socialProfiles:{linkedinUrl:"https://user:password@public.example/private",
    githubUrl:"javascript:alert(1)",portfolioUrl:"https://portfolio.example/"},
  });
  expect(facts.phoneMasked).toBe("••••3210");
  expect(facts.linkedIn).toBeNull();
  expect(facts.github).toBeNull();
  expect(facts.portfolio).toBe("https://portfolio.example/");
  expect(JSON.stringify(facts)).not.toContain("9876543210");
  expect(JSON.stringify(facts)).not.toContain("password");
 });
});
