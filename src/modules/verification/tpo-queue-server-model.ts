import {z} from "zod";
import {verificationTabStatuses} from "./queue-tabs";

/** Filter facts before the database result cap; never present local-only counts as global. */
export const tpoVerificationQuerySchema=z.object({
 tab:z.enum(["WAITING","SENT_BACK","VERIFIED"]).default("WAITING"),
 kind:z.enum(["ALL","EDUCATION","IDENTITY"]).default("ALL"),
 waitingState:z.enum(["ALL","SUBMITTED","UPDATE_PENDING"]).default("ALL"),
 waitingSince:z.enum(["ALL","TODAY","WEEK","OVER_WEEK"]).default("ALL"),
 search:z.string().trim().max(100).default(""),
 batchId:z.string().uuid().optional(),
 branchId:z.string().uuid().optional(),
 page:z.coerce.number().int().min(1).max(100000).default(1),
 pageSize:z.coerce.number().int().refine(n=>[25,50,100,1000].includes(n)).default(1000),
}).strict();
export type TpoVerificationQuery=z.infer<typeof tpoVerificationQuerySchema>;
export function tpoVerificationStatuses(query:Pick<TpoVerificationQuery,"tab"|"waitingState">){
 return [...verificationTabStatuses(query.tab,query.waitingState)];
}
export function tpoVerificationHref(query:TpoVerificationQuery){
 const params=new URLSearchParams({
  tab:query.tab,kind:query.kind,waitingState:query.waitingState,waitingSince:query.waitingSince,search:query.search,
  page:String(query.page),pageSize:String(query.pageSize),
 });
 if(query.batchId)params.set("batchId",query.batchId);
 if(query.branchId)params.set("branchId",query.branchId);
 return "/tpo/verification?"+params.toString();
}

/** India calendar days, not UTC midnights, for Waiting since. */
export function tpoVerificationWaitingDateRange(
 waitingSince:TpoVerificationQuery["waitingSince"],now=new Date(),
):{after?:Date;before?:Date}{
 if(waitingSince==="ALL")return {};
 const parts=new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).format(now);
 const start=new Date(parts+"T00:00:00+05:30");
 if(waitingSince==="TODAY")return {after:start};
 if(waitingSince==="WEEK")return {after:new Date(start.getTime()-6*86400000)};
 return {before:new Date(start.getTime()-7*86400000)};
}
