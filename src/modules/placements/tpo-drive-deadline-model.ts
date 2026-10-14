import {z} from "zod";
export const tpoDriveDeadlineSchema=z.object({
 confirmed:z.literal(true),expectedUpdatedAt:z.iso.datetime({offset:true})
  .transform(value=>new Date(value).toISOString()),
 reason:z.string().trim().min(10).max(1000),
 newDeadlineIso:z.string().datetime({offset:true}),
}).strict();
export type TpoDriveDeadlineInput=z.infer<typeof tpoDriveDeadlineSchema>;
export function evaluateTpoDriveDeadline(
 status:string,seasonStatus:string|null,previous:string|null,next:string,now:string,
){
 if(status!=="PUBLISHED"||seasonStatus!=="ACTIVE")return "READ_ONLY" as const;
 if(previous===null)return "NO_OLD_DEADLINE" as const;
 const oldAt=Date.parse(previous),nextAt=Date.parse(next),nowAt=Date.parse(now);
 if(!Number.isFinite(oldAt)||!Number.isFinite(nextAt)||!Number.isFinite(nowAt))
  return "INVALID_DATE" as const;
 if(nextAt<=nowAt)return "IN_PAST" as const;
 if(nextAt<=oldAt)return "NOT_LATER" as const;
 return "ALLOW" as const;
}
