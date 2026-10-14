import { z } from "zod";
export const learnerDriveApplySelectionSchema = z.object({
  roleOptionId:z.string().uuid(),
  channel:z.enum(["INTERNAL","EXTERNAL"]),
  confirmed:z.literal(true),
}).strict();
export function learnerDriveApplyGate(input:{
  hasApplication:boolean;deadlinePassed:boolean;canApply:boolean;
  applicationMode:string;channel:"INTERNAL"|"EXTERNAL";
}) {
  if(input.hasApplication)return "ALREADY_APPLIED" as const;
  if(input.deadlinePassed)return "DEADLINE_PASSED" as const;
  if(!input.canApply)return "NOT_ELIGIBLE" as const;
  if(input.channel==="INTERNAL" && input.applicationMode==="EXTERNAL_ONLY")return "CHANNEL_NOT_ALLOWED" as const;
  if(input.channel==="EXTERNAL" && input.applicationMode==="INTERNAL")return "CHANNEL_NOT_ALLOWED" as const;
  return "READY" as const;
}