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
