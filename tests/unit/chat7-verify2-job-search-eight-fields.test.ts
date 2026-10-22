import {describe,it,expect} from "vitest";
import {DEFAULT_LEARNER_JOB_FILTERS,filterLearnerPlacementJobs,type BrowseJobShape} from "@/modules/placements/learner-jobs-browse-model";
const job:BrowseJobShape={
 job:{id:"job-1",title:"Quantum Automation",description:"Dockside operations",
  responsibilities:"Stencil implementation",jobTypeLabel:"Apprenticeship",
  targetDepartmentName:"Mathematics",targetProgramName:"Computer Applications",
  applicationDeadline:null,publishedAt:"2026-10-20T00:00:00.000Z",status:"PUBLISHED"},
 company:{name:"Nimbus Systems"},
 roleOption:{id:"role-1",title:"Control Engineer",employmentType:"PART_TIME",
  locations:["Pune"],minimumAnnualCtcInr:null,maximumAnnualCtcInr:null},
 canApply:true,deadlinePassed:false,
};
describe("learner scoped job search",()=>{
 it.each(["quantum","nimbus","dockside","stencil","apprenticeship","pune",
  "mathematics","applications"])("searches %s",(term)=>{
  const found=filterLearnerPlacementJobs([job],{...DEFAULT_LEARNER_JOB_FILTERS,search:term});
  expect(found).toHaveLength(1);
 });
 it("supports SDE as a synonym for software engineer",()=>{
  const other={...job,job:{...job.job,responsibilities:"Software engineer"}};
  expect(filterLearnerPlacementJobs([other],{...DEFAULT_LEARNER_JOB_FILTERS,search:"sde"})).toHaveLength(1);
 });
 it("never expands an unauthorized empty list",()=>{
  expect(filterLearnerPlacementJobs([],{...DEFAULT_LEARNER_JOB_FILTERS,search:"quantum"})).toEqual([]);
 });
});
