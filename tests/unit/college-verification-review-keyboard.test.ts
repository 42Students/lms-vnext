import {describe,it,expect} from "vitest";
import {canDismissVerificationDialog} from "@/modules/verification/review-dialog-keyboard";
describe("College verification review drawer keyboard",()=>{
 it("closes on Escape except while a decision is in flight",()=>{
  expect(canDismissVerificationDialog("Escape",false)).toBe(true);
  expect(canDismissVerificationDialog("Escape",true)).toBe(false);
  expect(canDismissVerificationDialog("Enter",false)).toBe(false);
  expect(canDismissVerificationDialog("Tab",false)).toBe(false);
 });
});
