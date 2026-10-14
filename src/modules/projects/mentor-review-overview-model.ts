import {z} from "zod";
export const mentorReviewOverviewSchema=z.object({
 projectId:z.string().uuid(),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorReviewOverviewQuery=z.infer<typeof mentorReviewOverviewSchema>;
export function mentorReviewOverviewHref(query:MentorReviewOverviewQuery){
 const params=new URLSearchParams();
 if(query.page>1)params.set("page",String(query.page));
 const suffix=params.toString();
 return "/mentor/projects/"+encodeURIComponent(query.projectId)+"/review-overview"+
  (suffix?"?"+suffix:"");
}
export function classifyMentorDeliveryReview(value:{
 status:string;decision:string|null;feedbackPresent:boolean;
}){
 if(value.status==="DRAFT")return "Draft — not submitted";
 if(value.status==="SUBMITTED" && !value.decision)return "Awaiting review";
 if(value.decision==="APPROVED")return value.feedbackPresent?
  "Approved — feedback recorded":"Approved — feedback not recorded";
 if(value.decision==="CHANGES_REQUESTED")return value.feedbackPresent?
  "Changes requested — feedback recorded":"Changes requested — feedback unavailable";
 return "No recorded review decision";
}
export function mentorDeliveryReviewCounts(
 values:readonly {decision:string|null;feedbackPresent:boolean}[],
){
 return {reviewed:values.filter(x=>x.decision!==null).length,
  withFeedback:values.filter(x=>x.decision!==null&&x.feedbackPresent).length};
}
