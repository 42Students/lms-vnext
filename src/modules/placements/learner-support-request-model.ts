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
