import {describe,it,expect} from "vitest";
import {canRetryVerificationReview} from "@/modules/verification/review-retry-state";
describe("Staff verification detail failure recovery",()=>{
 it("never retries automatically and offers manual recovery after a fetch failure",()=>{
  expect(canRetryVerificationReview("Unable to load review",false)).toBe(true);
  expect(canRetryVerificationReview("Review is no longer available",false)).toBe(true);
  expect(canRetryVerificationReview("",false)).toBe(false);
  expect(canRetryVerificationReview("Network failure",true)).toBe(false);
 });
});
