import {describe,expect,it} from "vitest";
import {mentorFinalDeliveryCanReview,mentorFinalDeliveryDecisionSchema}
 from "@/modules/projects/mentor-final-delivery-decision-model";
describe("Mentor final review constraints",()=>{
 it("requires confirmed version and feedback on revision",()=>{
  const payload={decision:"APPROVED",confirmed:true,
   expectedUpdatedAt:"2026-10-14T03:04:05.123Z"};
  expect(mentorFinalDeliveryDecisionSchema.safeParse(payload).success).toBe(true);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({...payload,confirmed:false}).success).toBe(false);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({...payload,decision:"CHANGES_REQUESTED"}).success).toBe(false);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({...payload,collegeId:"forge"}).success).toBe(false);
 });
 it("does not re-review resolved or archived deliveries",()=>{
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ACTIVE")).toBe(true);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","COMPLETED")).toBe(false);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","PLANNED")).toBe(false);
  expect(mentorFinalDeliveryCanReview("APPROVED","COMPLETED")).toBe(false);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ARCHIVED")).toBe(false);
 });
});
