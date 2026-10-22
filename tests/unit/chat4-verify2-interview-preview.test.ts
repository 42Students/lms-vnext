import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { collegeInterviewPreviewSchema, summarizeCollegeInterviewPreview }
  from "@/modules/placements/college-interview-conflict-preview-model";

describe("W1 G2-12-030-015 cross-drive interview conflict preview", () => {
  const candidate={studentId:"learner-a",companyRelationshipId:"company-a",
    interviewer:" Ms Rao ",room:"Main Hall"};
  const rows=[
    {studentId:"learner-a",companyRelationshipId:"company-b",
      interviewerName:"Different interviewer",room:"Annex"},
    {studentId:"learner-b",companyRelationshipId:"company-a",
      interviewerName:"ms rao",room:"Other hall"},
    {studentId:"learner-c",companyRelationshipId:"company-b",
      interviewerName:"Ms Rao",room:"Third hall"},
    {studentId:"learner-d",companyRelationshipId:"company-a",
      interviewerName:"Unknown",room:" main hall "},
  ];
  it("counts candidate across drives, interviewer only within company and room within college", () => {
    expect(summarizeCollegeInterviewPreview(rows,candidate)).toEqual({
      candidate:1,interviewer:1,room:1,
    });
  });
  it("strictly validates time, selected candidate and optional editing exclusion", () => {
    const payload={
      applicationId:"11111111-1111-4111-8111-111111111111",
      scheduledAt:"2026-10-25T10:00:00+05:30",durationMinutes:60,
      interviewer:"Ms Rao",room:"Main Hall",
    };
    expect(collegeInterviewPreviewSchema.safeParse(payload).success).toBe(true);
    expect(collegeInterviewPreviewSchema.safeParse({...payload,durationMinutes:500}).success).toBe(false);
    expect(collegeInterviewPreviewSchema.safeParse({...payload,applicationId:"foreign"}).success).toBe(false);
    expect(collegeInterviewPreviewSchema.safeParse({...payload,collegeId:"forged"}).success).toBe(false);
  });
  it("checks persisted college scopes and suppresses private booking records", () => {
    const service=readFileSync("src/modules/placements/college-interview-conflict-preview.ts","utf8");
    const route=readFileSync("src/app/api/placements/college/jobs/[jobId]/interviews/preview/route.ts","utf8");
    const ui=readFileSync("src/components/placements/college-interview-appointments.tsx","utf8");
    expect(service).toContain("requireCollegePlacementAdmin(context)");
    expect(service).toContain("eq(placementJobs.collegeId,collegeId)");
    expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
    expect(service).toContain("eq(placementApplications.jobId,job.id)");
    expect(service).toContain("eq(placementApplications.membershipId,candidate.studentId)");
    expect(service).toContain("limit(501)");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(ui).toContain("Checking other interviews in this college");
    expect(ui).toContain("college-wide scheduling preview could not be loaded");
    expect(ui).toContain("key:previewKey,result,error:false");
  });
});
