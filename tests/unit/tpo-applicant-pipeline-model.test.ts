import { describe, expect, it } from "vitest";
import { applicantStage, projectTpoApplicantPipeline, tpoApplicantPipelineParams,tpoApplicantPipelinePage } from "@/modules/placements/tpo-applicant-pipeline-model";
const base={role:"Main",student:"A Learner",submittedAt:"2026-10-14T00:00:00Z"};
describe("TPO applicant stage projection",()=>{
  it("pages beyond 500 and clamps pages after filters reduce results",()=>{
   expect(tpoApplicantPipelinePage(501,21)).toMatchObject({page:21,totalPages:21,offset:500});
   expect(tpoApplicantPipelinePage(26,99)).toMatchObject({page:2,totalPages:2,offset:25});
   expect(tpoApplicantPipelinePage(0,2)).toMatchObject({page:1,totalPages:1});
   expect(tpoApplicantPipelineParams.safeParse({jobId:"550e8400-e29b-41d4-a716-446655440000",page:0}).success).toBe(false);
  });
  it("keeps withdrawn separate from old screening outcomes and preserves unknown as pending",()=>{
    const facts=[
      {...base,id:"1",applicationStatus:"SUBMITTED",screeningStatus:null},
      {...base,id:"2",applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED"},
      {...base,id:"3",applicationStatus:"WITHDRAWN",screeningStatus:"SHORTLISTED"},
    ];
    expect(applicantStage(facts[2]!)).toBe("WITHDRAWN");
    expect(projectTpoApplicantPipeline(facts,"ALL","").counts).toMatchObject({
      all:3,submitted:2,pending:1,shortlisted:1,withdrawn:1,
    });
    expect(projectTpoApplicantPipeline(facts,"SHORTLISTED","").rows).toHaveLength(1);
    expect(projectTpoApplicantPipeline(facts,"ALL","no-match").rows).toHaveLength(0);
  });
  it("validates application channel independently of stage",()=>{
    const jobId="550e8400-e29b-41d4-a716-446655440000";
    expect(tpoApplicantPipelineParams.parse({jobId,channel:"EXTERNAL"}).channel).toBe("EXTERNAL");
    expect(tpoApplicantPipelineParams.safeParse({jobId,channel:"MESSAGE"}).success).toBe(false);
  });
  it("rejects unsupported stage filters",()=>{
    expect(tpoApplicantPipelineParams.safeParse({jobId:"550e8400-e29b-41d4-a716-446655440000",stage:"SELECTED"}).success).toBe(false);
  });
});
