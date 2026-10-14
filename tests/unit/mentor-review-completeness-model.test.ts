import {describe,expect,it} from "vitest";
import {
  mentorReviewCompletenessQuerySchema,mentorReviewCompletenessHref,
  projectReviewCompleteness,reviewCompletenessPage,
} from "@/modules/projects/mentor-review-completeness-model";

const projectId="00000000-0000-4000-8000-000000000001";
describe("Mentor final-delivery review completeness evidence",()=>{
  it("labels only recorded approvals and revisions, without inferred feedback",()=>{
    const data=projectReviewCompleteness([
      {id:"a",version:1,status:"DRAFT",submittedAt:null,
        decision:null,reviewedAt:null,feedback:null},
      {id:"b",version:2,status:"SUBMITTED",submittedAt:new Date("2026-10-14T05:00:00Z"),
        decision:null,reviewedAt:null,feedback:null},
      {id:"c",version:3,status:"CHANGES_REQUESTED",submittedAt:new Date("2026-10-14T05:00:00Z"),
        decision:"CHANGES_REQUESTED",reviewedAt:new Date("2026-10-14T06:00:00Z"),
        feedback:"Please revise."},
      {id:"d",version:4,status:"APPROVED",submittedAt:new Date("2026-10-14T05:00:00Z"),
        decision:"APPROVED",reviewedAt:new Date("2026-10-14T06:00:00Z"),
        feedback:"  "},
    ]);
    expect(data.map(row=>[row.reviewLabel,row.reviewRecorded,row.writtenFeedbackRecorded]))
      .toEqual([
        ["Not submitted",false,false],
        ["No persisted review recorded",false,false],
        ["Changes requested",true,true],
        ["Approved",true,false],
      ]);
  });
  it("clamps empty/stale pages and rejects injected project/audience fields",()=>{
    expect(reviewCompletenessPage(0,88)).toEqual({
      total:0,pageSize:10,totalPages:1,page:1,
    });
    expect(reviewCompletenessPage(11,999).page).toBe(2);
    expect(mentorReviewCompletenessQuerySchema.safeParse({
      projectId,collegeId:projectId,
    }).success).toBe(false);
    expect(mentorReviewCompletenessQuerySchema.safeParse({
      projectId:"invalid",
    }).success).toBe(false);
    expect(mentorReviewCompletenessHref({projectId,page:2}))
      .toBe("/mentor/projects/"+projectId+"/review-completeness?page=2");
  });
});
