import {z} from "zod";

export const mentorReviewCompletenessQuerySchema=z.object({
  projectId:z.string().uuid(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type MentorReviewEvidence={
  id:string;version:number;status:string;submittedAt:Date|null;
  decision:string|null;reviewedAt:Date|null;feedback:string|null;
};

/** Persisted evidence only; absence of a record cannot establish a missed review. */
export function projectReviewCompleteness<T extends MentorReviewEvidence>(rows:readonly T[]) {
  return rows.map(row=>({
    ...row,
    reviewRecorded:row.decision==="APPROVED"||row.decision==="CHANGES_REQUESTED",
    writtenFeedbackRecorded:row.feedback!==null&&row.feedback.trim().length>0,
    reviewLabel:row.decision==="APPROVED"?"Approved":
      row.decision==="CHANGES_REQUESTED"?"Changes requested":
      row.status==="DRAFT"?"Not submitted":"No persisted review recorded",
  }));
}

/** Page-local counts only. Absent versions and private feedback are never inferred. */
export function reviewCoverageOnPage(rows:readonly {
 reviewRecorded:boolean;writtenFeedbackRecorded:boolean;
}[]) {
 return {
  reviewed:rows.filter(row=>row.reviewRecorded).length,
  withFeedback:rows.filter(row=>row.reviewRecorded&&row.writtenFeedbackRecorded).length,
 };
}

export function reviewCompletenessPage(total:number,requested:number) {
  const pageSize=10,totalPages=Math.max(1,Math.ceil(total/pageSize));
  return {total,pageSize,totalPages,page:Math.min(requested,totalPages)};
}

export function mentorReviewCompletenessHref(query:{projectId:string;page:number}) {
  const params=new URLSearchParams();
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/review-completeness"+(suffix?"?"+suffix:"");
}
