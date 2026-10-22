import {describe,it,expect} from "vitest";
import {learnerWithdrawalMode} from "@/modules/placements/learner-withdrawal-mode-model";
import {learnerApplicationWithdrawalSchema} from "@/modules/placements/learner-withdrawal-model";

describe("LEARNER-placements-R05 withdrawal mode and validation",()=>{
 it("LEARNER-placements-R05 allows self withdrawal before a scheduled round",()=>{
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:0,screeningStatus:"UNDER_REVIEW"})).toBe("SELF");
 });
 it("LEARNER-placements-R05 requires placement cell request after booking",()=>{
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:1,screeningStatus:"SHORTLISTED"})).toBe("REQUEST");
  expect(learnerWithdrawalMode({applicationStatus:"WITHDRAWN",scheduledRoundCount:0,screeningStatus:"SHORTLISTED"})).toBe("UNAVAILABLE");
 });
 it("LEARNER-placements-R05 requires placement cell review after screening even without a booked slot",()=>{
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:0,screeningStatus:"SHORTLISTED"})).toBe("REQUEST");
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:0,screeningStatus:"REJECTED"})).toBe("UNAVAILABLE");
  expect(learnerWithdrawalMode({applicationStatus:"SUBMITTED",scheduledRoundCount:0,screeningStatus:"PENDING"})).toBe("SELF");
 });
 it("LEARNER-placements-R05 enforces legacy 3 to 900 character reason and explicit confirmation",()=>{
  const base={action:"WITHDRAW",confirmed:true};
  expect(learnerApplicationWithdrawalSchema.safeParse({...base,reason:"Why"}).success).toBe(true);
  expect(learnerApplicationWithdrawalSchema.safeParse({...base,reason:"No"}).success).toBe(false);
  expect(learnerApplicationWithdrawalSchema.safeParse({...base,reason:"x".repeat(900)}).success).toBe(true);
  expect(learnerApplicationWithdrawalSchema.safeParse({...base,reason:"x".repeat(901)}).success).toBe(false);
  expect(learnerApplicationWithdrawalSchema.safeParse({action:"WITHDRAW",confirmed:false,reason:"Why"}).success).toBe(false);
 });
});