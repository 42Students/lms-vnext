import {describe,it,expect} from "vitest";
import {verificationReviewInput} from "@/modules/verification/review-input";
const id="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
describe("verification decision boundary",()=>{it("requires a reason and version",()=>{
 const base={learnerMembershipId:id,section:"IDENTITY",expectedVersion:2,action:"SEND_BACK"};
 expect(verificationReviewInput.safeParse(base).success).toBe(false);
 expect(verificationReviewInput.safeParse({...base,reason:"Document unclear"}).success).toBe(true);
 expect(verificationReviewInput.safeParse({...base,reason:"Document unclear",collegeId:id}).success).toBe(false);
 expect(verificationReviewInput.safeParse({...base,expectedVersion:0,reason:"No"}).success).toBe(false);
});});