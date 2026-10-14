import {learnerPlacementDashboard} from "@/modules/placements/learner-dashboard-model";
import {learnerDashboardPartialState} from "@/modules/placements/learner-dashboard-partial-model";
import {describe,expect,it} from "vitest";
const healthy={jobs:true,journey:true,rounds:true,offers:true,preferences:true,academic:true};
describe("dashboard attention overflow respects source availability",()=>{
  it("retains the full count and avoids showing hidden items as absent",()=>{
    const now=new Date("2026-10-14T00:00:00Z");
    const rounds=Array.from({length:5},(_,index)=>({
      applicationId:"app",roundId:"r"+index,roundKind:"INTERVIEW",roundName:"Round "+index,
      companyName:"Employer",roleTitle:"Engineer",scheduledAt:new Date("2026-10-16T00:00:00Z"),
      exception:null,
    }));
    const snapshot=learnerPlacementDashboard({jobs:[],applications:[],offers:[],rounds},now);
    const view=learnerDashboardPartialState(healthy,snapshot);
    expect(view.attention).toHaveLength(3);
    expect(view.attentionTotal).toBe(5);
    expect(view.attentionOverflow).toBe(2);
    expect(learnerDashboardPartialState({...healthy,rounds:false},snapshot))
      .toMatchObject({attention:null,attentionTotal:null,attentionOverflow:null});
  });
});
