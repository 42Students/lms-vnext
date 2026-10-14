import {z} from "zod";
import {csvSafeCell} from "./mentor-board-review-model";
export const mentorReviewOverviewSchema=z.object({
 projectId:z.string().uuid(),
 status:z.enum(["ALL","DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED"]).default("ALL"),
 feedback:z.enum(["ALL","WITH","WITHOUT"]).default("ALL"),
 version:z.coerce.number().int().min(1).max(1000000).optional(),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorReviewOverviewQuery=z.infer<typeof mentorReviewOverviewSchema>;
export function mentorReviewOverviewHref(query:MentorReviewOverviewQuery){
 const params=new URLSearchParams();
 if(query.status!=="ALL")params.set("status",query.status);
 if(query.feedback!=="ALL")params.set("feedback",query.feedback);
 if(query.version!==undefined)params.set("version",String(query.version));
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
export function mentorDeliveryReviewCsv(rows:readonly {
  id:string;version:number;status:string;reviewLabel:string;
  submittedAt:Date|null;reviewedAt:Date|null;feedbackPresent:boolean;
}[],omitted:number){
  const format=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
    day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",
    hourCycle:"h23"});
  const date=(value:Date|null)=>value?format.format(value)+" IST":"Not recorded";
  const lines=["Submission ID,Version,Status,Decision,Submitted (IST),Reviewed (IST),Written feedback recorded"];
  for(const row of rows)lines.push([row.id,row.version,row.status,row.reviewLabel,
    date(row.submittedAt),date(row.reviewedAt),row.feedbackPresent?"Yes":"No"]
    .map(csvSafeCell).join(","));
  if(omitted>0)lines.push(["","Truncated",omitted+" additional matching versions","","","",""]
    .map(csvSafeCell).join(","));
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
