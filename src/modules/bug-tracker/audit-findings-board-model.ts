import {z} from "zod";
import {BUG_SEVERITIES} from "./admin-validation";
import {BUG_STATUSES} from "./workflow";
const findingStatusOptions=["ALL",...BUG_STATUSES] as const;
const findingSeverityOptions=["ALL",...BUG_SEVERITIES] as const;
export const auditFindingsQuerySchema=z.strictObject({
 severity:z.enum(findingSeverityOptions).default("ALL"),
 environment:z.enum(["ALL","LOCAL","DEVELOPMENT","UAT","PRODUCTION","OTHER","NOT_SURE"]).default("ALL"),
 status:z.enum(findingStatusOptions).default("ALL"),
 q:z.string().trim().max(120).default(""),
 sort:z.enum(["newest","oldest"]).default("newest"),
 beforeCreatedAt:z.iso.datetime({offset:true}).optional(),
 beforeId:z.uuid().optional(),
}).superRefine((x,ctx)=>{
 if(Boolean(x.beforeCreatedAt)!==Boolean(x.beforeId))ctx.addIssue({code:"custom",path:["beforeId"],message:"Cursor requires timestamp and ID"});
});
export function trackerAuditFindingsInput(x:z.infer<typeof auditFindingsQuerySchema>) {
 return {
  status:x.status==="ALL"?undefined:x.status,
  severity:x.severity==="ALL"?undefined:x.severity,
  environment:x.environment==="ALL"?undefined:x.environment,
  q:x.q||undefined,sort:x.sort,limit:50,
  beforeCreatedAt:x.beforeCreatedAt,
  beforeId:x.beforeId,
 };
}
export function auditFindingPriority(severity:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW") {
 return ({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3} as const)[severity];
}

/** Guard against silently accepting a first value from repeated or unknown filters. */
export function parseAuditFindingsSearchParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(value=>Array.isArray(value)))return null;
 const parsed=auditFindingsQuerySchema.safeParse(raw);
 return parsed.success?parsed.data:null;
}
