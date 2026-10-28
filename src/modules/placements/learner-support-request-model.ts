import { z } from "zod";
export const learnerSupportListQuerySchema=z.object({
  status:z.enum(["ALL","PENDING","APPROVED","REJECTED","CANCELLED"]).optional(),
  type:z.enum(["ALL","APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION",
    "ABSENCE_DISPUTE","CORRECTION_WITH_PROOF","OFF_CAMPUS_OFFER",
    "OFFER_ACCEPTANCE_DISPUTE","REGISTRATION_CHANGE","PLACEMENT_AFTER_PLACEMENT"]).optional(),
  page:z.coerce.number().int().min(1).max(1000).optional(),
  pageSize:z.coerce.number().int().min(1).max(200).optional(),
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
    (type==="ALL"||row.request.requestType===type))
    .sort((a,b)=>b.request.requestedAt.getTime()-a.request.requestedAt.getTime()||
      a.request.id.localeCompare(b.request.id));
  const size=parsed.pageSize??20,total=matching.length;
  const totalPages=Math.max(1,Math.ceil(total/size));
  const actualPage=Math.min(page,totalPages);
  return {status,type,page:actualPage,totalPages,total,
    items:matching.slice((actualPage-1)*size,actualPage*size),
    hasMore:actualPage<totalPages,hasPrevious:actualPage>1,
    pageSize:size,olderPage:actualPage<totalPages?actualPage+1:null};
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
    default:return LEGACY_LEARNER_REQUEST_LABELS[value]??"Placement request";
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
 reason:string;requestedAt:Date;decisionNote:string|null;jobTitle:string|null;updatedAt:Date|null;
};
export function mergeLearnerPersonalRequestHistory(
 placementRows:readonly LearnerSupportRequestRow[],
 generalRows:readonly LearnerGeneralRequestHistorySource[],
):LearnerUnifiedRequestHistoryItem[]{
 const placement=placementRows.map(row=>({
  id:row.request.id,source:"PLACEMENT" as const,type:row.request.requestType,
  status:row.request.status,reason:row.request.reason,
  requestedAt:row.request.requestedAt,decisionNote:row.request.decisionNote,
  jobTitle:row.job.title,updatedAt:row.request.updatedAt,
 }));
 const general=generalRows.map(row=>({
  id:row.id,source:"GENERAL" as const,type:row.kind,status:row.status,
  reason:row.reason,requestedAt:row.requestedAt,decisionNote:row.decisionNote,
  jobTitle:null,updatedAt:null,
 }));
 return [...placement,...general].sort((left,right)=>
  right.requestedAt.getTime()-left.requestedAt.getTime()||
  left.source.localeCompare(right.source)||left.id.localeCompare(right.id));
}


/** Legacy /mine produced a descending array. Keep this explicit adapter for
 * old consumers while the page reader continues returning a bounded page. */
export function ownLearnerSupportRequestArray(rows:readonly LearnerSupportRequestRow[]){
 return [...rows].sort((left,right)=>
  right.request.requestedAt.getTime()-left.request.requestedAt.getTime()||
  left.request.id.localeCompare(right.request.id));
}

export const LEGACY_LEARNER_REQUEST_LABELS:Readonly<Record<string,string>>={
 APPLICATION_WITHDRAWAL:"Application withdrawal",
 OFFER_EXTENSION:"Offer deadline extension",
 ROUND_RESCHEDULE:"Interview or round reschedule",
 ABSENCE_DISPUTE:"Absence dispute",
 CORRECTION_WITH_PROOF:"Correction with proof",
 OFF_CAMPUS_OFFER:"External offer",
 OFFER_ACCEPTANCE_DISPUTE:"Offer acceptance dispute",
 REGISTRATION_CHANGE:"Registration change",
 PLACEMENT_AFTER_PLACEMENT:"Placement after placement (PAP)",
};
export const PLACEMENT_AFTER_PLACEMENT_REQUEST_HREF="/learn/my-placements/placement";

export const learnerUnifiedHistoryQuerySchema=z.object({
 status:z.string().trim().max(40).default("ALL"),
 type:z.string().trim().max(64).default("ALL"),
 page:z.coerce.number().int().min(1).max(1000).default(1),
 pageSize:z.coerce.number().int().min(1).max(200).default(20),
}).strict();
/** Merge both authorized sources, order once, then paginate; source callers
 * must scope each query by the current learner membership and college. */
export function learnerUnifiedPersonalRequestPage(
 placementRows:readonly LearnerSupportRequestRow[],
 generalRows:readonly LearnerGeneralRequestHistorySource[], raw:unknown,
){
 const q=learnerUnifiedHistoryQuerySchema.parse(raw);
 const all=mergeLearnerPersonalRequestHistory(placementRows,generalRows);
 const filtered=all.filter(row=>(q.status==="ALL"||row.status===q.status)&&
  (q.type==="ALL"||row.type===q.type));
 const total=filtered.length,totalPages=Math.max(1,Math.ceil(total/q.pageSize));
 const page=Math.min(q.page,totalPages);
 return {items:filtered.slice((page-1)*q.pageSize,page*q.pageSize),
  page,pageSize:q.pageSize,total,totalPages,
  olderPage:page<totalPages?page+1:null,hasPrevious:page>1,
  hasMore:page<totalPages};
}
