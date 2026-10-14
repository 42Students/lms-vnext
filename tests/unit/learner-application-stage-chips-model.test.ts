import {describe,expect,it} from "vitest";
import {learnerApplicationStageCounts} from "@/modules/placements/learner-application-stage-chips-model";
describe("learner owned application stage chips",()=>{
  const submitted=new Date("2026-10-14T00:00:00.000Z");
  const app=(id:string,status:string,withdrawnAt:Date|null=null)=>({
    applicationId:id,jobTitle:"Engineer",companyName:"College Drive",
    submittedAt:submitted,withdrawnAt,applicationStatus:withdrawnAt?"WITHDRAWN":"SUBMITTED",
    screening:{status,decidedAt:null},results:[],
  });
  it("derives accurate and deterministic counts from the complete own list",()=>{
    expect(learnerApplicationStageCounts([
      app("a","UNDER_REVIEW"),app("b","SHORTLISTED"),app("c","SHORTLISTED"),
      app("d","REJECTED"),app("e","UNDER_REVIEW",submitted),
    ])).toEqual([
      {stage:"all",count:5},{stage:"REJECTED",count:1},
      {stage:"SHORTLISTED",count:2},{stage:"UNDER_REVIEW",count:1},
      {stage:"WITHDRAWN",count:1},
    ]);
  });
  it("does not invent stages for an empty list",()=>{
    expect(learnerApplicationStageCounts([])).toEqual([{stage:"all",count:0}]);
  });
});