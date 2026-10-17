import {parseActivityDateBoundary} from "@/modules/activity/date-boundary";
import {z} from "zod";
export const GLOBAL_TPO_REQUEST_TYPES=["ALL","APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION"] as const;
export const globalTpoRequestsQuerySchema = z.object({
  status: z.enum(["PENDING","APPROVED","REJECTED","CANCELLED","ALL"]).default("PENDING"),
  requestType: z.enum(GLOBAL_TPO_REQUEST_TYPES).default("ALL"),
  age: z.enum(["ALL","TODAY","ONE_TO_TWO_DAYS","OLDER_THAN_1_DAY","OLDER_THAN_2_DAYS","OLDER_THAN_7_DAYS","OLDER_THAN_30_DAYS","LAST_30_DAYS"]).default("ALL"),
  sort: z.enum(["URGENCY_FIRST","NEWEST_FIRST","OLDEST_FIRST","DECIDED_NEWEST","DECIDED_OLDEST"]).default("URGENCY_FIRST"),
  search: z.string().trim().max(150).default(""),
  urgentOnly: z.union([z.literal("true"),z.literal(true)]).transform(()=>true).optional(),
  jobId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().refine(value=>[25,50,100].includes(value)).default(25),
}).strict();
export function requestKindMatches(actual:string,selected:(typeof GLOBAL_TPO_REQUEST_TYPES)[number]){
 return selected==="ALL"||actual===selected;
}

export type TpoRequestUrgencyFact={
 status:string;requestType:string;requestedAt:Date;nextRoundAt?:Date|null;
};
export function tpoRequestUrgent(row:TpoRequestUrgencyFact,now:Date):boolean{
 if(row.status!=="PENDING")return false;
 const due=row.nextRoundAt?.getTime();
 if(due!==undefined&&Number.isFinite(due)&&due>=now.getTime()&&due<=now.getTime()+86400000)return true;
 return row.requestType==="APPLICATION_WITHDRAWAL"&&
  row.requestedAt.getTime()<=now.getTime()-86400000;
}
export function tpoNextRoundCue(row:{nextRoundAt?:Date|null;nextRoundName?:string|null},now:Date):string|null{
 const next=row.nextRoundAt;
 if(!next||!Number.isFinite(next.getTime()))return null;
 const day=(d:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
 const tomorrow=new Date(now.getTime()+86400000);
 const dayLabel=day(next)===day(now)?"today":day(next)===day(tomorrow)?"tomorrow":
  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(next);
 const time=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true}).format(next);
 return (row.nextRoundName||"Next round")+" "+dayLabel+" "+time+" IST";
}
export function sortTpoRequestRows<T extends {id:string;requestedAt:Date;status?:string;requestType?:string;nextRoundAt?:Date|null;decidedAt?:Date|null}>(
 rows:readonly T[],sort:"URGENCY_FIRST"|"NEWEST_FIRST"|"OLDEST_FIRST"|"DECIDED_NEWEST"|"DECIDED_OLDEST",now:Date=new Date(),
):T[]{
 if(sort==="URGENCY_FIRST"){
  const rank=(r:T)=>{
   if(r.status!=="PENDING")return 2;
   return tpoRequestUrgent({...r,status:r.status,requestType:r.requestType??""},now)?0:1;
  };
  return [...rows].sort((a,b)=>{
   const diff=rank(a)-rank(b);
   if(diff!==0)return diff;
   const left=a.nextRoundAt?.getTime(),right=b.nextRoundAt?.getTime();
   if(rank(a)===0){
    if(left!==undefined&&right!==undefined&&left!==right)return left-right;
    if(left!==undefined&&right===undefined)return -1;
    if(left===undefined&&right!==undefined)return 1;
   }
   return a.requestedAt.getTime()-b.requestedAt.getTime()||a.id.localeCompare(b.id);
  });
 }
 if(sort==="DECIDED_NEWEST"||sort==="DECIDED_OLDEST"){
  const descending=sort==="DECIDED_NEWEST";
  return [...rows].sort((a,b)=>{
   const left=a.decidedAt?.getTime()??null,right=b.decidedAt?.getTime()??null;
   if(left===null&&right!==null)return 1;
   if(right===null&&left!==null)return -1;
   if(left!==null&&right!==null&&left!==right)return descending?right-left:left-right;
   return a.id.localeCompare(b.id);
  });
 }
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

export function tpoRequestContextLink(row:{requestType:string;roundId:string|null;offerId:string|null;jobId:string}):{href:string;label:string}{
 if(row.requestType==="ROUND_RESCHEDULE"&&row.roundId){
   return {href:"/tpo/drive-day/"+encodeURIComponent(row.roundId),label:"Open round"};
 }
 if(row.requestType==="OFFER_EXTENSION"&&row.offerId){
   return {href:"/tpo/placements/jobs/"+encodeURIComponent(row.jobId)+"/joining",label:"Review offer and joining"};
 }
 return {href:"/tpo/placements/jobs/"+encodeURIComponent(row.jobId),label:"Open drive"};
}

/** Read-only URL recovery never attempts a data query with invalid filters. */
export function parseGlobalTpoRequestFilters(raw:unknown){
 return globalTpoRequestsQuerySchema.safeParse(raw);
}

export function globalTpoRequestFirstPageHref(query:{
 status:string;age:string;sort:string;requestType:string;search:string;pageSize:number;urgentOnly?:boolean;jobId?:string;
}){
 const p=new URLSearchParams();
 p.set("status",query.status);
 if(query.age!=="ALL")p.set("age",query.age);
 p.set("sort",query.sort);
 if(query.requestType!=="ALL")p.set("requestType",query.requestType);
 if(query.search)p.set("search",query.search);
 if(query.urgentOnly)p.set("urgentOnly","true");
 if(query.jobId)p.set("jobId",query.jobId);
 p.set("page","1");p.set("pageSize",String(query.pageSize));
 return "/tpo/requests?"+p.toString();
}

/** Fixed clock injection makes the age cutoff reproducible in tests. */
export function tpoRequestAgeCutoff(age:"ALL"|"TODAY"|"ONE_TO_TWO_DAYS"|"OLDER_THAN_1_DAY"|"OLDER_THAN_2_DAYS"|"OLDER_THAN_7_DAYS"|"OLDER_THAN_30_DAYS"|"LAST_30_DAYS",asOf:Date){
 if(age==="ALL"||age==="TODAY"||age==="ONE_TO_TWO_DAYS"||age==="LAST_30_DAYS")return undefined;
 return new Date(asOf.getTime()-(age==="OLDER_THAN_1_DAY"?1:age==="OLDER_THAN_2_DAYS"?2:age==="OLDER_THAN_7_DAYS"?7:30)*86400000);
}

/** A cleared request search keeps the selected decision queue, without carrying stale pagination. */
export function tpoRequestClearAdvancedHref(status:z.infer<typeof globalTpoRequestsQuerySchema>["status"]){
 return "/tpo/requests?"+new URLSearchParams({status,page:"1"}).toString();
}

/** Date-only today is a Kolkata calendar day; "1–2 days" uses elapsed 24–48h. */
export function tpoRequestDateBounds(age:z.infer<typeof globalTpoRequestsQuerySchema>["age"],asOf:Date){
 if(age==="TODAY"){
  const day=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(asOf);
  return {after:parseActivityDateBoundary(day,"from"),before:new Date(parseActivityDateBoundary(day,"to").getTime()+1)};
 }
 if(age==="ONE_TO_TWO_DAYS")return {after:new Date(asOf.getTime()-2*86400000),before:new Date(asOf.getTime()-86400000)};
 if(age==="LAST_30_DAYS")return {after:new Date(asOf.getTime()-30*86400000),before:undefined};
 return {after:undefined,before:tpoRequestAgeCutoff(age,asOf)};
}
