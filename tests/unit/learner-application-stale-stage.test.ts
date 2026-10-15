import {describe,expect,it} from "vitest";
import {learnerApplicationStageSelection} from "@/modules/placements/learner-application-stage-selection-model";
describe("learner application stale-stage recovery",()=>{
 it("keeps valid owned application stages",()=>{
  expect(learnerApplicationStageSelection(["SHORTLISTED","REJECTED"],"SHORTLISTED"))
   .toEqual({stage:"SHORTLISTED",stale:false});
 });
 it("recovers a stale or forged stage without treating the learner as empty",()=>{
  expect(learnerApplicationStageSelection(["SHORTLISTED"],"FOREIGN_STATUS"))
   .toEqual({stage:"all",stale:true});
  expect(learnerApplicationStageSelection([],"REJECTED").stale).toBe(true);
 });
});