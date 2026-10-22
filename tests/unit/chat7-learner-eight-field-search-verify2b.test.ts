import {describe,expect,it} from "vitest";
import {
 DEFAULT_LEARNER_JOB_FILTERS,
 filterLearnerPlacementJobs,
 type BrowseJobShape,
} from "@/modules/placements/learner-jobs-browse-model";

const item:BrowseJobShape={
 job:{
  id:"scoped-job",title:"Graduate Engineering",description:"A hands-on opportunity",
  responsibilities:"Own backend reliability",jobTypeLabel:"Full-time",
  targetDepartmentName:"Computer Science",targetProgramName:"B.Tech",
  status:"PUBLISHED",applicationDeadline:null,
 },
 company:{name:"Northstar Labs"},
 roleOption:{
  id:"scoped-role",title:"Platform Engineer",employmentType:"FULL_TIME",
  locations:["Hyderabad"],minimumAnnualCtcInr:700000,maximumAnnualCtcInr:900000,
 },
 canApply:true,deadlinePassed:false,
};
const hits=["Graduate","Northstar","hands-on","reliability","Full-time","Hyderabad","Computer Science","B.Tech"];
describe("legacy authorized learner job search",()=>{
 it.each(hits)("matches the legacy field %s after tenant-scoped projection",(search)=>{
  expect(filterLearnerPlacementJobs([item],{...DEFAULT_LEARNER_JOB_FILTERS,search}))
   .toHaveLength(1);
 });
 it("expands known synonyms without broadening the authorized job set",()=>{
  expect(filterLearnerPlacementJobs([item],{...DEFAULT_LEARNER_JOB_FILTERS,search:"sde"}))
   .toHaveLength(0);
  const remote={...item,roleOption:{...item.roleOption,locations:["Remote"]}};
  expect(filterLearnerPlacementJobs([remote],{...DEFAULT_LEARNER_JOB_FILTERS,search:"wfh"}))
   .toHaveLength(1);
  expect(filterLearnerPlacementJobs([],{...DEFAULT_LEARNER_JOB_FILTERS,search:"Northstar"}))
   .toHaveLength(0);
 });
});
