import {describe,it,expect} from "vitest";
import {verificationReviewInput} from "@/modules/verification/review-input";
describe("decision input",()=>{it("requires a server-held version and a sendback reason",()=>{
 const id="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
 const input={learnerMembershipId:id,section:"EDUCATION",expectedVersion:1,action:"SEND_BACK",reason:"Wrong marksheet"};
 expect(verificationReviewInput.safeParse(input).success).toBe(true);
 expect(verificationReviewInput.safeParse({...input,expectedVersion:-1}).success).toBe(false);
});});
