import {z} from "zod";
export const mentorDeliveryVersionParamsSchema=z.object({
  projectId:z.string().uuid(),submissionId:z.string().uuid(),
}).strict();
export type MentorDeliveryVersion={
  id:string;version:number;status:string;submittedAt:Date|null;
  createdAt?:Date;submittedByMembershipId?:string|null;createdByMembershipId?:string;
  summary?:string;notes?:string|null;sourceUrl?:string|null;demoUrl?:string|null;
  attachments?:unknown[];lockedAt?:Date|null;reopenedAt?:Date|null;
  decision:string|null;reviewedAt:Date|null;feedback:string|null;
};
export function mentorDeliveryVersionDisplay(record:MentorDeliveryVersion){
  const decision=record.decision==="APPROVED"?"Approved":
    record.decision==="CHANGES_REQUESTED"?"Changes requested":
    record.status==="DRAFT"?"Draft — not submitted":"No recorded review decision";
  return {id:record.id,version:record.version,status:record.status,
    createdAt:record.createdAt??null,submittedByMembershipId:record.submittedByMembershipId??null,
    createdByMembershipId:record.createdByMembershipId??null,
    summary:record.summary??"",notes:record.notes??null,
    sourceUrl:record.sourceUrl??null,demoUrl:record.demoUrl??null,
    attachments:record.attachments??[],lockedAt:record.lockedAt??null,
    reopenedAt:record.reopenedAt??null,
    submittedAt:record.submittedAt,reviewedAt:record.reviewedAt,
    decisionLabel:decision,feedback:record.feedback?.trim()||null,
    hasReview:record.decision==="APPROVED"||record.decision==="CHANGES_REQUESTED",
    submissionType:(record.attachments??[]).some(a=>Boolean(a)&&typeof a==="object"&&
      (a as {kind?:unknown}).kind==="FILE")?"File upload":
      record.sourceUrl||record.demoUrl?"Link":"Text"};
}
