import {describe,it,expect} from "vitest";
import {verificationReviewInput} from "@/modules/verification/review-input";
describe("PG review fixture boundary",()=>{it("rejects stale zero versions ahead of persistence",()=>{
 const id="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
 expect(verificationReviewInput.safeParse({learnerMembershipId:id,section:"IDENTITY",action:"SEND_BACK",reason:"Unclear",expectedVersion:0}).success).toBe(false);
});});
