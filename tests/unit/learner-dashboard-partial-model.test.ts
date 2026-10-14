import {describe,expect,it} from "vitest";
import {learnerPlacementDashboard} from "@/modules/placements/learner-dashboard-model";
import {learnerDashboardPartialState} from "@/modules/placements/learner-dashboard-partial-model";
const snapshot=learnerPlacementDashboard({
  jobs:[],applications:[],rounds:[],offers:[],
},new Date("2026-10-14T00:00:00Z"));
const healthy={jobs:true,journey:true,rounds:true,offers:true,preferences:true,academic:true};
describe("partial source failures on learner Placements dashboard",()=>{
  it("never interprets unavailable schedule, jobs, applications or offers as zero",()=>{
    const partial=learnerDashboardPartialState({
      ...healthy,jobs:false,journey:false,rounds:false,offers:false,
    },snapshot);
    expect(partial).toMatchObject({
      partial:true,openJobs:null,applications:null,assessments:null,
      interviews:null,attention:null,weekEvents:null,nextAction:null,
      activeOffers:null,firstRun:null,
    });
    expect(partial.failed).toHaveLength(4);
  });
  it("keeps genuine available empty values at zero",()=>{
    const result=learnerDashboardPartialState(healthy,snapshot);
    expect(result).toMatchObject({
      partial:false,openJobs:0,applications:0,assessments:0,interviews:0,
      attention:[],weekEvents:[],
    });
    expect(result.failed).toEqual([]);
  });
  it("does not show an apparently complete next-action when offers failed",()=>{
    expect(learnerDashboardPartialState({...healthy,offers:false},snapshot).nextAction).toBeNull();
  });
  it("flags evidence failure without masking healthy jobs and rounds",()=>{
    const partial=learnerDashboardPartialState({...healthy,academic:false},snapshot);
    expect(partial.failed).toEqual(["Academic placement evidence"]);
    expect(partial.openJobs).toBe(0);
    expect(partial.assessments).toBe(0);
  });
});
