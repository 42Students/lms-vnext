import {z} from "zod";
import {verificationTabStatuses} from "./queue-tabs";

/** Filter facts before the database result cap; never present local-only counts as global. */
export const tpoVerificationQuerySchema=z.object({
 tab:z.enum(["WAITING","SENT_BACK","VERIFIED"]).default("WAITING"),
 kind:z.enum(["ALL","EDUCATION","IDENTITY"]).default("ALL"),
 waitingState:z.enum(["ALL","SUBMITTED","UPDATE_PENDING"]).default("ALL"),
 page:z.coerce.number().int().min(1).max(100000).default(1),
 pageSize:z.coerce.number().int().refine(n=>[25,50,100].includes(n)).default(50),
}).strict();
export type TpoVerificationQuery=z.infer<typeof tpoVerificationQuerySchema>;
export function tpoVerificationStatuses(query:Pick<TpoVerificationQuery,"tab"|"waitingState">){
 return [...verificationTabStatuses(query.tab,query.waitingState)];
}
export function tpoVerificationHref(query:TpoVerificationQuery){
 const params=new URLSearchParams({
  tab:query.tab,kind:query.kind,waitingState:query.waitingState,
  page:String(query.page),pageSize:String(query.pageSize),
 });
 return "/tpo/verification?"+params.toString();
}
