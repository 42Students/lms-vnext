import {describe,it,expect} from "vitest";
import {learnerWithdrawalMode} from "@/modules/placements/learner-withdrawal-mode-model";
describe("LEARNER-placements-29 booked round withdrawal",()=>{
 it("LEARNER-placements-29 routes booked learner through staff request",()=>{
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:2,screeningStatus:"SHORTLISTED"})).toBe("REQUEST");
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:0,screeningStatus:"UNDER_REVIEW"})).toBe("SELF");
 });
 it("LEARNER-placements-29 blocks withdrawn application duplicate actions",()=>{
  expect(learnerWithdrawalMode({applicationStatus:"WITHDRAWN",scheduledRoundCount:0,screeningStatus:"SHORTLISTED"})).toBe("UNAVAILABLE");
 });
});