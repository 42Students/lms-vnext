import {describe,it,expect} from "vitest";
import {verificationReviewSummary} from "@/modules/verification/review-summary";
describe("review summary",()=>{it("does not enable decisions for already verified records",()=>{
 const summary=verificationReviewSummary({status:"VERIFIED",section:"IDENTITY",version:3,submittedAt:new Date("2026-10-01T00:00:00Z"),decidedAt:null,note:null});
 expect(summary.canDecide).toBe(false);expect(summary.sectionLabel).toBe("Identity");
});});