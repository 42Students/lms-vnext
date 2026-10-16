import {describe,it,expect} from "vitest";
import {learnerVerificationNoticeCopy} from "@/modules/placements/learner-verification-notice-model";
describe("LEARNER-profile-misc-16/17 verification notices",()=>{
 it("preserves verified reviewer identity and date",()=>{
  expect(learnerVerificationNoticeCopy({status:"VERIFIED",reason:null,
   heading:"Education",decidedByName:"Officer",verifiedAt:"2026-10-17T10:00:00Z"}))
   .toContain("Verified by Officer on");
 });
 it("never infers reviewer identity when absent",()=>{
  expect(learnerVerificationNoticeCopy({status:"VERIFIED",reason:null,
   heading:"Education",decidedByName:null,verifiedAt:null})).toBe("Verified");
  expect(learnerVerificationNoticeCopy({status:"SENT_BACK",reason:"Fix grade",
    heading:"Education",decidedByName:null,verifiedAt:null})).toContain("Fix grade");
 });
});
