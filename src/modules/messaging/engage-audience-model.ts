import { z } from "zod";
import { campaignRecipientDisposition } from "./tpo-campaign-send-policy";
export const engageAudienceQuerySchema=z.object({
  segment:z.enum(["ALL_ELIGIBLE","UNASSIGNED","NEW"]).default("ALL_ELIGIBLE"),
}).strict();
export type EngageContact={
  id:string;emailNorm:string|null;manualStage:string;ownerMembershipId:string|null;
  unsubscribedAt:Date|null;inviteBouncedAt:Date|null;
};
export function summarizeEngageAudience(contacts:readonly EngageContact[], segment:z.infer<typeof engageAudienceQuerySchema>["segment"]){
 let eligible=0,withoutEmail=0,unsubscribed=0,bounced=0,notNow=0,outsideSegment=0;
 for(const row of contacts){
  if(segment==="NEW"&&row.manualStage!=="NEW"||
    segment==="UNASSIGNED"&&row.ownerMembershipId!==null){outsideSegment++;continue;}
  // Preview must apply the same suppression precedence as dispatch planning.
  // Empty/whitespace email addresses are never eligible recipients.
  const disposition=campaignRecipientDisposition(row);
  if(disposition==="UNSUBSCRIBED"){unsubscribed++;continue;}
  if(disposition==="NO_EMAIL"){withoutEmail++;continue;}
  if(disposition==="BOUNCED"){bounced++;continue;}
  if(disposition==="NOT_NOW"){notNow++;continue;}
  eligible++;
 }
 return {total:contacts.length,eligible,withoutEmail,unsubscribed,bounced,notNow,outsideSegment};
}
