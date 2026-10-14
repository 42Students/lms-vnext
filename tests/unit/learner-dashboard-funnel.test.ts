import {describe,expect,it} from "vitest";
import {learnerPlacementApplicationFunnel} from "@/modules/placements/learner-dashboard-funnel-model";
describe("scoped placement application stage breakdown",()=>{
 it("counts each real application once, prioritizes withdrawal",()=>{
  const statuses=[
   {applicationStatus:"SUBMITTED",screening:{status:"UNDER_REVIEW"}},
   {applicationStatus:"SUBMITTED",screening:{status:"SHORTLISTED"}},
   {applicationStatus:"SUBMITTED",screening:{status:"REJECTED"}},
   {applicationStatus:"WITHDRAWN",screening:{status:"SHORTLISTED"}},
   {applicationStatus:"SUBMITTED",screening:{status:"UNKNOWN"}},
  ];
  const result=learnerPlacementApplicationFunnel(statuses);
  expect(result.total).toBe(5);
  expect(result.stages.map(stage=>stage.count)).toEqual([1,1,1,1,1]);
 });
 it("can show a real zero only for a successful empty journey",()=>{
  const empty=learnerPlacementApplicationFunnel([]);
  expect(empty.total).toBe(0);
  expect(empty.stages.every(x=>x.count===0)).toBe(true);
 });
});
