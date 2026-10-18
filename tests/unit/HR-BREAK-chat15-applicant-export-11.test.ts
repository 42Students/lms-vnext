import {describe,expect,it} from "vitest";
import {buildHrApplicantCsv,HR_APPLICANT_EXPORT_CAP}
 from "@/modules/placements/hr-applicant-export-model";
import {hrApplicantFilterSchema,projectSharedApplicants,hrApplicantPageBounds}
 from "@/modules/placements/hr-job-applicants-model";
import type {SharedApplicant} from "@/modules/placements/hr-job-applicants-model";

const own:SharedApplicant={
 id:"application-1",name:"=HYPERLINK(\"https://malicious.example\")",role:"+SUM(1,2)",
 status:"SUBMITTED",screening:"SHORTLISTED",
 submittedAt:new Date("2099-01-01T18:30:00.000Z"),
 email:"private@example.invalid",phone:"+911234567890",rollNumber:"SECRET001",
 branch:"Sensitive branch",githubUrl:"https://private.example.invalid/",
 sharedSkills:["Not authorized for export"],
};
describe("HR-APPLICANTS-EXPORT-11 role-limited CSV and state-boundary disclosure",()=>{
 it("neutralizes spreadsheet formulas, quotes and control-prefixes without releasing contacts",()=>{
  const result=buildHrApplicantCsv([own],1);
  expect(result.csv.startsWith("\uFEFF")).toBe(true);
  expect(result.csv).toContain("'=HYPERLINK");
  expect(result.csv).toContain("'+SUM(1,2)");
  expect(result.csv).toContain("02/01/2099");
  for(const sensitive of [
   own.email!,own.phone!,own.rollNumber!,own.branch!,
   own.githubUrl!,own.sharedSkills![0]!,
  ])expect(result.csv).not.toContain(sensitive);
  expect(result.csv).toContain('"Masked"');
  const hostile=buildHrApplicantCsv([{...own,name:"  \t@SUM(9,9)",
   role:"\r\n=cmd|'/C calc'!A0"}],1);
  expect(hostile.csv).toContain("'  \t@SUM");
  expect(hostile.csv).toContain("'\r\n=cmd");
  expect(hostile.csv).not.toContain("private@example.invalid");
 });
 it("caps at 200 authorized rows and reports every omitted row without silent truncation",()=>{
  const rows=Array.from({length:HR_APPLICANT_EXPORT_CAP+3},(_,index)=>({
   ...own,id:"app-"+index,
  }));
  const out=buildHrApplicantCsv(rows,rows.length);
  expect(out.exported).toBe(HR_APPLICANT_EXPORT_CAP);
  expect(out.omitted).toBe(3);
  expect(out.csv).toContain("3 additional authorized applicants");
  expect(out.csv).not.toContain("app-202");
  expect(rows).toHaveLength(HR_APPLICANT_EXPORT_CAP+3);
 });
 it("withdrawn applicants are excluded from active shortlist while counts describe the scoped input",()=>{
  const withdrawn={...own,id:"application-2",status:"WITHDRAWN"};
  expect(projectSharedApplicants([own,withdrawn],"SHORTLISTED").rows).toEqual([own]);
  const withdrawnResult=projectSharedApplicants([own,withdrawn],"WITHDRAWN");
  expect(withdrawnResult.rows).toEqual([withdrawn]);
  expect(withdrawnResult.counts).toEqual({all:2,shortlisted:1,withdrawn:1});
 });
 it("rejects unbounded pages, forged view keys and invalid filter statuses",()=>{
  for(const filter of [
   {page:0},{page:10001},{stage:"INTERNAL_SHORTLIST"},{companyId:"foreign"},
   {applicant:"../college"},{offerState:"DRAFT"},
  ])expect(hrApplicantFilterSchema.safeParse(filter).success).toBe(false);
  expect(hrApplicantPageBounds(3,51)).toEqual({
   page:3,pageSize:25,pages:3,first:51,last:51,
  });
  expect(hrApplicantPageBounds(4,51).first).toBe(0);
 });
});
