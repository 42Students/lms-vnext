import {z} from "zod";
export const mentorDeliveryVersionParamsSchema=z.object({
  projectId:z.string().uuid(),submissionId:z.string().uuid(),
}).strict();
export type MentorDeliveryVersion={
  id:string;version:number;status:string;submittedAt:Date|null;
  decision:string|null;reviewedAt:Date|null;feedback:string|null;
};
export function mentorDeliveryVersionDisplay(record:MentorDeliveryVersion){
  const decision=record.decision==="APPROVED"?"Approved":
    record.decision==="CHANGES_REQUESTED"?"Changes requested":
    record.status==="DRAFT"?"Draft — not submitted":"No recorded review decision";
  return {id:record.id,version:record.version,status:record.status,
    submittedAt:record.submittedAt,reviewedAt:record.reviewedAt,
    decisionLabel:decision,feedback:record.feedback?.trim()||null,
    hasReview:record.decision==="APPROVED"||record.decision==="CHANGES_REQUESTED"};
}
