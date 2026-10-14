import {describe,expect,it} from "vitest";
import {mentorReviewOverviewSchema,mentorReviewOverviewHref,
 classifyMentorDeliveryReview,mentorDeliveryReviewCounts,mentorDeliveryReviewCsv} from "@/modules/projects/mentor-review-overview-model";
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
 it("neutralizes formula injection and explains capped delivery review exports",()=>{
  const csv=mentorDeliveryReviewCsv([{
    id:"x",version:1,status:"APPROVED",reviewLabel:"=Unsafe label",
    submittedAt:null,reviewedAt:null,feedbackPresent:false,
  }],3);
  expect(csv).toContain("'=Unsafe label");
  expect(csv).toContain("3 additional matching versions");
  expect(csv).toContain("Not recorded");
  const q=mentorReviewOverviewSchema.parse({
    projectId:id,status:"CHANGES_REQUESTED",feedback:"WITH",page:2,
  });
  expect(mentorReviewOverviewHref(q)).toContain("feedback=WITH");
  expect(mentorReviewOverviewSchema.safeParse({projectId:id,feedback:"PERSONAL"}).success).toBe(false);
 });
 it("rejects caller-supplied scope and invalid page and retains authorized project",()=>{
  expect(mentorReviewOverviewSchema.safeParse({projectId:id,collegeId:id}).success).toBe(false);
  expect(mentorReviewOverviewSchema.safeParse({projectId:"bad"}).success).toBe(false);
  expect(mentorReviewOverviewSchema.safeParse({projectId:id,page:0}).success).toBe(false);
  expect(mentorReviewOverviewHref({projectId:id,status:"ALL",feedback:"ALL",page:3}))
   .toBe("/mentor/projects/"+id+"/review-overview?page=3");
 });
});
