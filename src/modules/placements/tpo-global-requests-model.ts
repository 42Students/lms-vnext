import {z} from "zod";
export const GLOBAL_TPO_REQUEST_TYPES=["ALL","APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION"] as const;
export const globalTpoRequestsQuerySchema = z.object({
  status: z.enum(["PENDING","APPROVED","REJECTED","CANCELLED"]).default("PENDING"),
  requestType: z.enum(GLOBAL_TPO_REQUEST_TYPES).default("ALL"),
  age: z.enum(["ALL","OLDER_THAN_7_DAYS"]).default("ALL"),
  sort: z.enum(["NEWEST_FIRST","OLDEST_FIRST"]).default("NEWEST_FIRST"),
  search: z.string().trim().max(150).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().refine(value=>[25,50,100].includes(value)).default(25),
}).strict();
export function requestKindMatches(actual:string,selected:(typeof GLOBAL_TPO_REQUEST_TYPES)[number]){
 return selected==="ALL"||actual===selected;
}

export function sortTpoRequestRows<T extends {id:string;requestedAt:Date}>(rows:readonly T[],sort:"NEWEST_FIRST"|"OLDEST_FIRST"):T[]{
 const direction=sort==="OLDEST_FIRST"?1:-1;
 return [...rows].sort((a,b)=>direction*(a.requestedAt.getTime()-b.requestedAt.getTime())||direction*a.id.localeCompare(b.id));
}

export function isTpoRequestOlderThan(requestedAt:Date,now:Date,days:number):boolean{
 return requestedAt.getTime()<now.getTime()-days*86400000;
}

export const TPO_REQUEST_STATUSES=["PENDING","APPROVED","REJECTED","CANCELLED"] as const;
export function tpoRequestStatusCounts(summary:{pending:number;approved:number;rejected:number;cancelled:number}){
 return {PENDING:summary.pending,APPROVED:summary.approved,REJECTED:summary.rejected,CANCELLED:summary.cancelled};
}

export function tpoRequestAgeLabel(requestedAt:Date,asOf:Date):string{
 const elapsed=Math.max(0,asOf.getTime()-requestedAt.getTime());
 if(elapsed<3600000)return "Less than 1 hour old";
 if(elapsed<86400000)return Math.floor(elapsed/3600000)+" hours old";
 const days=Math.floor(elapsed/86400000);
 return days+" day"+(days===1?"":"s")+" old";
}
