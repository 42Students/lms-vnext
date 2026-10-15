import {describe,it,expect} from "vitest";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {describeVerificationReviewResult} from "@/modules/verification/review-result";
describe("College review version conflicts",()=>{
 it("states stale version requires a fresh read rather than immediate replay",()=>{
  const version=new VerificationStateError("STALE_VERSION");
  expect(version.code).toBe("STALE_VERSION");
  expect(describeVerificationReviewResult({ok:false,code:"STALE_VERSION"})).toMatch(/refresh/i);
 });
});
