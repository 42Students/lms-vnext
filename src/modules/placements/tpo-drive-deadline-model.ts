import {z} from "zod";
/** Normalize unambiguous legacy local clock input to IST before validating. */
export function normalizeTpoDriveDeadlineIst(value:string):string{
 const trimmed=value.trim();
 if(!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(trimmed))return trimmed;
 const local=trimmed.replace(" ","T");
 const full=local.length===16?local+":00":local;
 const instant=new Date(full+"+05:30");
 if(!Number.isFinite(instant.getTime())||
   new Date(instant.getTime()+330*60_000).toISOString().slice(0,19)!==full)
  return trimmed;
 return full+"+05:30";
}
export const tpoDriveDeadlineSchema=z.object({
 confirmed:z.literal(true),expectedUpdatedAt:z.iso.datetime({offset:true})
  .transform(value=>new Date(value).toISOString()),
 reason:z.string().trim().min(10).max(1000),
 newDeadlineIso:z.string({error:issue=>issue.input===undefined||issue.input===null
  ?"newDeadline is required":"newDeadline must be an ISO date-time"})
  .trim().min(1,{message:"newDeadline is required"})
  .transform(normalizeTpoDriveDeadlineIst)
  .pipe(z.iso.datetime({offset:true,message:"newDeadline must be an ISO date-time"})),
}).strict();
export type TpoDriveDeadlineInput=z.infer<typeof tpoDriveDeadlineSchema>;
export function evaluateTpoDriveDeadline(
 status:string,seasonStatus:string|null,previous:string|null,next:string,now:string,
){
 if(status!=="PUBLISHED"||seasonStatus!=="ACTIVE")return "READ_ONLY" as const;
 const oldAt=previous===null?null:Date.parse(previous),nextAt=Date.parse(next),nowAt=Date.parse(now);
 if((oldAt!==null&&!Number.isFinite(oldAt))||!Number.isFinite(nextAt)||!Number.isFinite(nowAt))
  return "INVALID_DATE" as const;
 if(nextAt<=nowAt)return "IN_PAST" as const;
 if(oldAt!==null&&nextAt<=oldAt)return "NOT_LATER" as const;
 return "ALLOW" as const;
}

/** Show legacy actionable copy while retaining the stronger no-backwards extension policy. */
export function tpoDriveDeadlineErrorMessage(
 decision:ReturnType<typeof evaluateTpoDriveDeadline>,
):string|null{
 switch(decision){
  case "ALLOW":return null;
  case "INVALID_DATE":return "newDeadline must be an ISO date-time";
  case "IN_PAST":return "The new deadline must be in the future";
  case "NOT_LATER":return "The new deadline must be later than the current application deadline";
  case "READ_ONLY":return "Only an active, published drive can have its deadline extended";
 }
}
