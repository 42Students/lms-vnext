import {describe,expect,it} from "vitest";
import {hrInlineRoundResultFilters,hrInlineRoundResultsHref} from "@/modules/placements/hr-inline-round-results-model";
import {hrApplicantFilterSchema} from "@/modules/placements/hr-job-applicants-model";
import {projectRecruiterRoundResults} from "@/modules/placements/recruiter-round-results-read-model";
const roundId="00000000-0000-4000-8000-000000000010";
const jobId="00000000-0000-4000-8000-000000000020";
const rounds=[{id:roundId,name:"Technical",sequence:1,kind:"TEST",status:"COMPLETED",
 participants:[{applicationId:"student-1",displayName:"A",result:{status:"STAGED",outcome:"HOLD",scorePercent:50,waitlistRank:2}},
  {applicationId:"student-2",displayName:"B",result:null}]}];
describe("HR embedded recruiter results table",()=>{
 it("binds filters and exact validated round identity",()=>{
  expect(hrApplicantFilterSchema.safeParse({tab:"rounds",roundId,outcome:"HOLD"}).success).toBe(true);
  expect(hrApplicantFilterSchema.safeParse({tab:"rounds",roundId:"foreign"}).success).toBe(false);
  expect(hrApplicantFilterSchema.safeParse({tab:"rounds",outcome:"SELECTED"}).success).toBe(false);
  expect(hrInlineRoundResultsHref(jobId,roundId,"HOLD")).toBe(
    "/hr/placements/jobs/"+jobId+"?tab=rounds&roundId="+roundId+"&outcome=HOLD");
 });
 it("limits outcomes to projected shortlisted people, excludes internal notes",()=>{
  const filtered=projectRecruiterRoundResults(rounds,roundId,"HOLD");
  expect(filtered?.counts).toMatchObject({all:2,recorded:1,unrecorded:1,hold:1});
  expect(filtered?.rows[0]).toMatchObject({name:"A",outcome:"HOLD",status:"STAGED"});
  expect(filtered?.rows[0]).not.toHaveProperty("internalComment");
  expect(projectRecruiterRoundResults(rounds,"another-round","ALL")).toBeNull();
  expect(hrInlineRoundResultFilters(filtered?.counts).find(x=>x.value==="HOLD")?.count).toBe(1);
 });
});
