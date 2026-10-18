import {describe,expect,it} from "vitest";
import {buildHrApplicantCsv,HR_APPLICANT_EXPORT_CAP}
 from "@/modules/placements/hr-applicant-export-model";
import type {SharedApplicant} from "@/modules/placements/hr-job-applicants-model";
const applicant=(name:string,submittedAt=new Date("2099-01-01T18:30:00.000Z")):SharedApplicant=>({
 id:"a",name,role:"Graduate engineer",status:"SUBMITTED",screening:"SHORTLISTED",
 submittedAt,email:"private@learner.example",phone:"+910000000000",resumeShared:true,
});
describe("HR-APPLICANT-EXPORT-70: CSV exports are capped, safe and private",()=>{
 it("never exports contact fields or formula content as an executable spreadsheet cell",()=>{
  const row={...applicant(" =HYPERLINK(1,2)"),role:"\t@SUM(1,2)"};
  const csv=buildHrApplicantCsv([row],1).csv;
  expect(csv).toContain("' =HYPERLINK");
  expect(csv).toContain("'\t@SUM");
  expect(csv).not.toContain("private@learner.example");
  expect(csv).not.toContain("+910000000000");
  expect(csv).toContain("Masked");
 });
 it("does not crash on corrupt persisted submittedAt and never invents its timestamp",()=>{
  const result=buildHrApplicantCsv([applicant("Candidate",new Date(Number.NaN))],1);
  expect(result.csv).toContain("Date unavailable");
  expect(result.exported).toBe(1);
 });
 it("never displays NaN, Infinity, negative or fractional omitted counts",()=>{
  const row=applicant("Candidate");
  for(const badTotal of [Number.NaN,Number.POSITIVE_INFINITY,-1,1.5]){
   const result=buildHrApplicantCsv([row],badTotal);
   expect(result.omitted).toBe(0);
   expect(result.csv).not.toContain("NaN additional");
   expect(result.csv).not.toContain("Infinity additional");
  }
 });
 it("caps an oversized authorized page and reports a truthful omitted count",()=>{
  const rows=Array.from({length:HR_APPLICANT_EXPORT_CAP+9},(_,i)=>({
   ...applicant("Candidate "+i),id:"a"+i,
  }));
  const result=buildHrApplicantCsv(rows,rows.length);
  expect(result.exported).toBe(HR_APPLICANT_EXPORT_CAP);
  expect(result.omitted).toBe(9);
  expect(result.csv).toContain("9 additional authorized applicants");
 });
});
