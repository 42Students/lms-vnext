import {describe,expect,it} from "vitest";
import {mentorDeliveryVersionDisplay,mentorDeliveryVersionParamsSchema}
  from "@/modules/projects/mentor-delivery-version-model";
describe("Mentor exact persisted final delivery review",()=>{
  it("preserves actual feedback and recorded decision without inventing metadata",()=>{
    const now=new Date("2026-10-14T10:00:00.000Z");
    expect(mentorDeliveryVersionDisplay({
      id:"id",version:2,status:"CHANGES_REQUESTED",submittedAt:now,
      decision:"CHANGES_REQUESTED",reviewedAt:now,feedback:"  Refine scope.  ",
    })).toMatchObject({version:2,decisionLabel:"Changes requested",feedback:"Refine scope.",
      hasReview:true});
    expect(mentorDeliveryVersionDisplay({
      id:"id",version:1,status:"DRAFT",submittedAt:null,
      decision:null,reviewedAt:null,feedback:null,
    })).toMatchObject({decisionLabel:"Draft — not submitted",feedback:null,hasReview:false});
  });
  it("rejects tenant injection or forged project/version identifiers",()=>{
    const ids={projectId:"00000000-0000-4000-8000-000000000001",
      submissionId:"00000000-0000-4000-8000-000000000002"};
    expect(mentorDeliveryVersionParamsSchema.safeParse(ids).success).toBe(true);
    expect(mentorDeliveryVersionParamsSchema.safeParse({...ids,collegeId:"forged"}).success)
      .toBe(false);
    expect(mentorDeliveryVersionParamsSchema.safeParse({...ids,projectId:"not-a-uuid"}).success)
      .toBe(false);
  });
});
