import { z } from "zod";
export const learnerSupportListQuerySchema=z.object({
  status:z.enum(["ALL","PENDING","APPROVED","REJECTED","CANCELLED"]).optional(),
  type:z.enum(["ALL","APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION"]).optional(),
  page:z.coerce.number().int().min(1).max(1000).optional(),
}).strict();
export type LearnerSupportRequestRow={
  request:{id:string;requestType:string;status:string;reason:string;
    requestedAt:Date;decisionNote:string|null;updatedAt:Date;},
  job:{title:string;id:string},roleOption:{title:string},company:{name:string}
};
/** Filters and slices only the authenticated learner's persisted request rows. */
export function ownLearnerSupportRequestList(rows:readonly LearnerSupportRequestRow[],raw:unknown){
  const parsed=learnerSupportListQuerySchema.parse(raw);
  const status=parsed.status??"ALL",type=parsed.type??"ALL",page=parsed.page??1;
  const matching=rows.filter(row=>
    (status==="ALL"||row.request.status===status)&&
    (type==="ALL"||row.request.requestType===type));
  const size=20,total=matching.length;
  const totalPages=Math.max(1,Math.ceil(total/size));
  const actualPage=Math.min(page,totalPages);
  return {status,type,page:actualPage,totalPages,total,
    items:matching.slice((actualPage-1)*size,actualPage*size),
    hasMore:actualPage<totalPages,hasPrevious:actualPage>1};
}
export function learnerSupportHistoryHref({status="ALL",type="ALL",page=1}:{
  status?:string;type?:string;page?:number;
}) {
  const valid=learnerSupportListQuerySchema.parse({status,type,page});
  const q=new URLSearchParams();
  if(valid.status!=="ALL")q.set("status",valid.status!);
  if(valid.type!=="ALL")q.set("type",valid.type!);
  if((valid.page??1)>1)q.set("page",String(valid.page));
  const search=q.toString();
  return "/learn/my-placements/support"+(search?"?"+search:"");
}
export function placementRequestTypeLabel(value:string){
  switch(value){
    case "APPLICATION_WITHDRAWAL":return "Application withdrawal";
    case "ROUND_RESCHEDULE":return "Interview or round reschedule";
    case "OFFER_EXTENSION":return "Offer deadline extension";
    default:return "Placement request";
  }
}

/** Cross-table personal history projection. Callers must fetch both sets with
 * the authenticated membership + college, then apply filters/pagination AFTER
 * combining. Never fabricate a placement Job for a general request.
 */
export type LearnerGeneralRequestHistorySource={
 id:string;kind:string;status:string;reason:string;requestedAt:Date;
 decisionNote:string|null;
};
export type LearnerUnifiedRequestHistoryItem={
 id:string;source:"PLACEMENT"|"GENERAL";type:string;status:string;
 reason:string;requestedAt:Date;decisionNote:string|null;jobTitle:string|null;
};
export function mergeLearnerPersonalRequestHistory(
 placementRows:readonly LearnerSupportRequestRow[],
 generalRows:readonly LearnerGeneralRequestHistorySource[],
):LearnerUnifiedRequestHistoryItem[]{
 const placement=placementRows.map(row=>({
  id:row.request.id,source:"PLACEMENT" as const,type:row.request.requestType,
  status:row.request.status,reason:row.request.reason,
  requestedAt:row.request.requestedAt,decisionNote:row.request.decisionNote,
  jobTitle:row.job.title,
 }));
 const general=generalRows.map(row=>({
  id:row.id,source:"GENERAL" as const,type:row.kind,status:row.status,
  reason:row.reason,requestedAt:row.requestedAt,decisionNote:row.decisionNote,
  jobTitle:null,
 }));
 return [...placement,...general].sort((left,right)=>
  right.requestedAt.getTime()-left.requestedAt.getTime()||
  left.source.localeCompare(right.source)||left.id.localeCompare(right.id));
}
