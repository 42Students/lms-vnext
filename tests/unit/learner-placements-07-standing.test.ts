import {describe,it,expect} from "vitest";
import {learnerApplicationStage} from "@/modules/placements/learner-applications-browse-model";
import type {LearnerApplicationBrowseItem} from "@/modules/placements/learner-applications-browse-model";
const base: LearnerApplicationBrowseItem={applicationId:"a",jobTitle:"Role",companyName:"Company",applicationStatus:"SUBMITTED",
 submittedAt:new Date("2099-01-01"),withdrawnAt:null,screening:{status:"SHORTLISTED",decidedAt:null},
 results:[],offerStatus:null};
describe("LEARNER-placements-07 owned application standing",()=>{
 it("LEARNER-placements-07 distinguishes waitlisted and rejected applied outcomes",()=>{
  expect(learnerApplicationStage({...base,results:[{appliedAt:new Date("2099-01-02"),outcome:"HOLD"}]})).toBe("WAITLISTED");
  expect(learnerApplicationStage({...base,results:[{appliedAt:new Date("2099-01-02"),outcome:"FAIL"}]})).toBe("REJECTED");
 });
 it("LEARNER-placements-07 prioritizes accepted offer over screening",()=>{
  expect(learnerApplicationStage({...base,offerStatus:"ACCEPTED"})).toBe("HIRED");
 });
});