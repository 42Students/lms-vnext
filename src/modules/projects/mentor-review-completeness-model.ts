import {z} from "zod";

export const mentorReviewCompletenessQuerySchema=z.object({
  projectId:z.string().uuid(),
  page:z.preprocess(v=>typeof v==="string"&&/^[1-9][0-9]{0,4}$/.test(v)
    ?Number(v):v,z.number().int().min(1).max(10000).default(1)),
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

export function reviewCompletenessPage(total:number,requested:number) {
  const pageSize=10;
  const boundedTotal=Number.isSafeInteger(total)&&total>=0?total:0;
  const totalPages=Math.max(1,Math.ceil(boundedTotal/pageSize));
  const safeRequested=Number.isSafeInteger(requested)&&requested>=1?requested:1;
  return {total:boundedTotal,pageSize,totalPages,page:Math.min(safeRequested,totalPages)};
}

export function mentorReviewCompletenessHref(query:{projectId:string;page:number}) {
  const params=new URLSearchParams();
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/review-completeness"+(suffix?"?"+suffix:"");
}
