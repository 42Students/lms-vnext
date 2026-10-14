import {describe,expect,it} from "vitest";
import {learnerDashboardSafeFallback} from "@/modules/placements/learner-dashboard-fallback-model";
import type {PlacementDashboardAvailability} from "@/modules/placements/learner-dashboard-partial-model";
const ready:PlacementDashboardAvailability={jobs:true,journey:true,rounds:true,offers:true,preferences:true,academic:true};
describe("L11-009 fallback navigation on partial learner dashboard",()=>{
 it("permits browse only when own published-drive source succeeded",()=>{
  expect(learnerDashboardSafeFallback({...ready,journey:false})?.href).toBe("/learn/my-placements/jobs");
  expect(learnerDashboardSafeFallback({...ready,rounds:false})?.href).toBe("/learn/my-placements/jobs");
 });
 it("does not advertise a source that failed",()=>{
  expect(learnerDashboardSafeFallback({...ready,jobs:false})).toBeNull();
 });
});
