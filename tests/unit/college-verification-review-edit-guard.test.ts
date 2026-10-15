import {describe,it,expect} from "vitest";
import {canEditVerificationDecision} from "@/modules/verification/review-edit-guard";
describe("Review confirmation input freeze",()=>{
 it("permits editing only before confirmation",()=>{
  expect(canEditVerificationDecision(false,null)).toBe(true);
  expect(canEditVerificationDecision(false,"SEND_BACK")).toBe(false);
  expect(canEditVerificationDecision(false,"VERIFY")).toBe(false);
  expect(canEditVerificationDecision(true,null)).toBe(false);
 });
});
