import {describe,expect,it} from "vitest";
import {mentorReviewOverviewSchema,mentorReviewOverviewHref,
 classifyMentorDeliveryReview,mentorDeliveryReviewCounts} from "@/modules/projects/mentor-review-overview-model";
const id="00000000-0000-4000-8000-000000000001";
describe("Mentor final-delivery feedback completeness",()=>{
 it("distinguishes missing review and recorded feedback without inventing it",()=>{
  expect(classifyMentorDeliveryReview({status:"DRAFT",decision:null,feedbackPresent:false}))
   .toBe("Draft — not submitted");
  expect(classifyMentorDeliveryReview({status:"SUBMITTED",decision:null,feedbackPresent:false}))
   .toBe("Awaiting review");
  expect(classifyMentorDeliveryReview({status:"APPROVED",decision:"APPROVED",feedbackPresent:false}))
   .toBe("Approved — feedback not recorded");
  expect(classifyMentorDeliveryReview({status:"CHANGES_REQUESTED",decision:"CHANGES_REQUESTED",feedbackPresent:true}))
   .toBe("Changes requested — feedback recorded");
  expect(mentorDeliveryReviewCounts([{decision:null,feedbackPresent:false},
   {decision:"APPROVED",feedbackPresent:false},
   {decision:"CHANGES_REQUESTED",feedbackPresent:true}]))
   .toEqual({reviewed:2,withFeedback:1});
 });
 it("rejects caller-supplied scope and invalid page and retains authorized project",()=>{
  expect(mentorReviewOverviewSchema.safeParse({projectId:id,collegeId:id}).success).toBe(false);
  expect(mentorReviewOverviewSchema.safeParse({projectId:"bad"}).success).toBe(false);
  expect(mentorReviewOverviewSchema.safeParse({projectId:id,page:0}).success).toBe(false);
  expect(mentorReviewOverviewHref({projectId:id,page:3}))
   .toBe("/mentor/projects/"+id+"/review-overview?page=3");
 });
});
