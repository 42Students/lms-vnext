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
/** Preserve one value per filter: repeated or foreign URL keys must never
 * silently choose the first value before an authorized roster read. */
export function parseTpoVerificationParams(
 raw:Record<string,string|string[]|undefined>,
):TpoVerificationQuery|null{
 const allowed=new Set(["tab","kind","waitingState","waitingSince","search","batchId","branchId","page","pageSize"]);
 if(Object.keys(raw).some(key=>!allowed.has(key)))return null;
 if(Object.values(raw).some(Array.isArray))return null;
 const parsed=tpoVerificationQuerySchema.safeParse(raw);
 return parsed.success?parsed.data:null;
}
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
 // Use one IST midnight boundary for both ranges: no unclassified seventh
 // calendar day between WEEK and OVER_WEEK. The repository uses >= / <=.
 const sevenDayBoundary=new Date(start.getTime()-7*86400000);
 if(waitingSince==="WEEK")return {after:sevenDayBoundary};
 return {before:new Date(sevenDayBoundary.getTime()-1)};
}
