import {describe,it,expect} from "vitest";
import {describeVerificationReviewResult} from "@/modules/verification/review-result";
describe("review outcomes",()=>{it("never suggests retrying a stale write blind",()=>{
 expect(describeVerificationReviewResult({ok:false,code:"STALE_VERSION"})).toContain("Refresh");
 expect(describeVerificationReviewResult({ok:true,nextVersion:3})).toBe("Verification decision saved");
});});