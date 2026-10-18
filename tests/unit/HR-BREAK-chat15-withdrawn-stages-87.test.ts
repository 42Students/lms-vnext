import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {projectSharedApplicants,HR_RECRUITER_STAGES,
 type SharedApplicant,type HrApplicantStage}
 from "@/modules/placements/hr-job-applicants-model";

const base:SharedApplicant={
 id:"active",name:"Learner",role:"Engineer",status:"SUBMITTED",screening:"SHORTLISTED",
 submittedAt:new Date("2099-01-01T00:00:00Z"),email:null,
};
const withdrawn:SharedApplicant={...base,id:"withdrawn",status:"WITHDRAWN"};
describe("HR-APPLICANTS-87: withdrawn learner never appears in active recruiter funnel",()=>{
 it.each(["ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED"] as HrApplicantStage[])(
  "%s stage retains submitted applicants and excludes historically shortlisted withdrawals",stage=>{
   const result=projectSharedApplicants([base,withdrawn],stage);
   expect(result.rows).toEqual([base]);
   expect(result.counts).toEqual({all:2,shortlisted:1,withdrawn:1});
  });
 it("retains history in ALL and WITHDRAWN, without exposing a withdrawn applicant as APPLIED",()=>{
  expect(projectSharedApplicants([base,withdrawn],"ALL").rows).toEqual([base,withdrawn]);
  expect(projectSharedApplicants([base,withdrawn],"WITHDRAWN").rows).toEqual([withdrawn]);
  expect(projectSharedApplicants([base,withdrawn],"APPLIED").rows).toEqual([base]);
 });
 it("the filter tab matrix still exposes every documented legacy stage label",()=>{
  expect(HR_RECRUITER_STAGES.map(item=>item.value))
   .toEqual(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED","WITHDRAWN"]);
 });
 it("database stage filter and stage count use the same active status boundary",()=>{
  const src=readFileSync(join(process.cwd(),"src/modules/placements/hr-job-read-service.ts"),"utf8");
  expect(src).toContain('activeMilestoneStage?eq(placementApplications.status,"SUBMITTED"):undefined');
  for(const stage of ["ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED"]){
   expect(src).toContain("= 'SUBMITTED' and ${stageConditions."+stage+"}");
  }
 });
});