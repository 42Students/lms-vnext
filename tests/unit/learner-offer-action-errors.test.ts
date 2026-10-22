import {describe,expect,it} from "vitest";
import {learnerOfferActionErrorMessage} from "@/modules/placements/learner-offer-action-error-model";
describe("non-leaking learner offer action failures",()=>{
 it("gives a useful expired or concurrent-update instruction",()=>{
  expect(learnerOfferActionErrorMessage(409)).toContain("changed or expired");
  expect(learnerOfferActionErrorMessage(422)).toContain("Refresh");
 });
 it("does not reveal existence on role or college denial",()=>{
  expect(learnerOfferActionErrorMessage(403)).toBe("This offer is not available to your current account. Switch to your learner workspace and refresh My offers.");
  expect(learnerOfferActionErrorMessage(404)).toBe(learnerOfferActionErrorMessage(403));
 });
 it("does not echo opaque backend text on unexpected failures",()=>{
  expect(learnerOfferActionErrorMessage(500)).not.toContain("stack");
  expect(learnerOfferActionErrorMessage(503)).toContain("please retry");
 });
});