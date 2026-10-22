import { z } from "zod";

export const collegeInterviewPreviewSchema = z.strictObject({
  applicationId: z.uuid(),
  scheduledAt: z.iso.datetime({offset:true}),
  durationMinutes: z.number().int().min(5).max(480),
  interviewer: z.string().trim().max(255).nullable().optional(),
  room: z.string().trim().max(500).nullable().optional(),
  excludingInterviewId: z.uuid().optional(),
});

export function summarizeCollegeInterviewPreview(
  rows: readonly {
    studentId:string;companyRelationshipId:string;
    interviewerName:string|null;room:string;
  }[],
  candidate:{studentId:string;companyRelationshipId:string;
    interviewer:string;room:string},
) {
  const sameText=(left:string|null,right:string)=>
    Boolean(left && right && left.trim().toLocaleLowerCase()===right.trim().toLocaleLowerCase());
  return {
    candidate:rows.filter(row=>row.studentId===candidate.studentId).length,
    interviewer:rows.filter(row=>row.companyRelationshipId===candidate.companyRelationshipId &&
      sameText(row.interviewerName,candidate.interviewer)).length,
    room:rows.filter(row=>sameText(row.room,candidate.room)).length,
  };
}
