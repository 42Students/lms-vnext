import {describe,expect,it} from "vitest";
import {mentorFinalDeliveryDecisionSchema,mentorFinalDeliveryCanReview} from
 "@/modules/projects/mentor-final-delivery-decision-model";
const expectedUpdatedAt="2026-10-24T10:00:00.000Z";
describe("Mentor final delivery approve/request changes workflow",()=>{
 it("requires a confirmed current-version decision",()=>{
  expect(mentorFinalDeliveryDecisionSchema.safeParse({
   decision:"APPROVED",expectedUpdatedAt,confirmed:true,
  }).success).toBe(true);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({
   decision:"APPROVED",confirmed:true,
  }).success).toBe(false);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({
   decision:"APPROVED",expectedUpdatedAt,confirmed:false,
  }).success).toBe(false);
 });
 it("rejects send-back without trimmed actionable feedback",()=>{
  for(const feedback of [undefined,"","   "]){
   expect(mentorFinalDeliveryDecisionSchema.safeParse({
    decision:"CHANGES_REQUESTED",feedback,expectedUpdatedAt,confirmed:true,
   }).success).toBe(false);
  }
  expect(mentorFinalDeliveryDecisionSchema.safeParse({
   decision:"CHANGES_REQUESTED",feedback:"Report lacks results",
   expectedUpdatedAt,confirmed:true,
  }).success).toBe(true);
 });
 it("permits review only for submitted unlocked active project work",()=>{
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ACTIVE",false)).toBe(true);
  for(const [status,projectStatus,locked] of [
   ["DRAFT","ACTIVE",false],["APPROVED","ACTIVE",false],
   ["SUBMITTED","ARCHIVED",false],["SUBMITTED","COMPLETED",false],
   ["SUBMITTED","ACTIVE",true],
  ] as const)expect(mentorFinalDeliveryCanReview(status,projectStatus,locked)).toBe(false);
 });
});
