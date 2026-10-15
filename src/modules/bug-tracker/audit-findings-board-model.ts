import {z} from "zod";
import {BUG_SEVERITIES} from "./admin-validation";
import {BUG_STATUSES} from "./workflow";
const findingStatusOptions=["ALL",...BUG_STATUSES] as const;
const findingSeverityOptions=["ALL",...BUG_SEVERITIES] as const;
export const auditFindingsQuerySchema=z.strictObject({
 severity:z.enum(findingSeverityOptions).default("ALL"),
 status:z.enum(findingStatusOptions).default("ALL"),
 q:z.string().trim().max(120).default(""),
 beforeCreatedAt:z.iso.datetime({offset:true}).optional(),
 beforeId:z.uuid().optional(),
}).superRefine((x,ctx)=>{
 if(Boolean(x.beforeCreatedAt)!==Boolean(x.beforeId))ctx.addIssue({code:"custom",path:["beforeId"],message:"Cursor requires timestamp and ID"});
});
export function trackerAuditFindingsInput(x:z.infer<typeof auditFindingsQuerySchema>) {
 return {
  status:x.status==="ALL"?undefined:x.status,
  severity:x.severity==="ALL"?undefined:x.severity,
  q:x.q||undefined,sort:"newest" as const,limit:50,
  beforeCreatedAt:x.beforeCreatedAt,
  beforeId:x.beforeId,
 };
}
export function auditFindingPriority(severity:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW") {
 return ({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3} as const)[severity];
}
