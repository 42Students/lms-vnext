import { z } from "zod";
export const learnerDriveApplySelectionSchema = z.object({
  roleOptionId:z.string().uuid(),
  channel:z.enum(["INTERNAL","EXTERNAL"]),
  confirmed:z.literal(true),
}).strict();
/** A withdrawn row is not always final: server-side application-service may
 * restore it only on the same channel, before screening/round/offer progress.
 * Never infer that permission from the WITHDRAWN label alone. */
export const withdrawnPlacementReapplyGuidance =
  "Some early withdrawn applications can be restored. If you cannot reapply, ask your placement team to review the application.";

export function learnerDriveApplyGate(input:{
  hasApplication:boolean;applicationStatus?:string|null;
  deadlinePassed:boolean;canApply:boolean;
  applicationMode:string;channel:"INTERNAL"|"EXTERNAL";
}) {
  if(input.hasApplication && input.applicationStatus==="WITHDRAWN")
    return "WITHDRAWN_REAPPLY_REVIEW" as const;
  if(input.hasApplication)return "ALREADY_APPLIED" as const;
  if(input.deadlinePassed)return "DEADLINE_PASSED" as const;
  if(!input.canApply)return "NOT_ELIGIBLE" as const;
  if(input.channel==="INTERNAL" && input.applicationMode==="EXTERNAL_ONLY")return "CHANNEL_NOT_ALLOWED" as const;
  if(input.channel==="EXTERNAL" && input.applicationMode==="INTERNAL")return "CHANNEL_NOT_ALLOWED" as const;
  return "READY" as const;
}