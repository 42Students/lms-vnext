import {describe,expect,it} from "vitest";
import {verificationDecisionConfirmation} from "@/modules/verification/review-confirmation";
describe("College verification two-step reviewer confirmation",()=>{
 it("requires a named explicit verify confirmation",()=>{
  const output=verificationDecisionConfirmation("VERIFY","EDUCATION","");
  expect(output.heading).toContain("Confirm");
  expect(output.button).toBe("Confirm verification");
  expect(output.message).toContain("learner");
 });
 it("makes the correction reason visible before sending back",()=>{
  const output=verificationDecisionConfirmation("SEND_BACK","IDENTITY","  Upload a clearer document  ");
  expect(output.message).toContain("Upload a clearer document");
  expect(output.message).not.toContain("  Upload a clearer document  ");
 });
});
