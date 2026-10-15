/** T-S2-04: the delivery gate must recheck current lead facts at dispatch. */
export const TPO_CAMPAIGN_MAX_RECIPIENTS=500;
export type CampaignRecipientFact={
  emailNorm:string|null;
  unsubscribedAt:Date|null;
  inviteBouncedAt:Date|null;
  manualStage:string;
};
export function campaignRecipientDisposition(value:CampaignRecipientFact):
  "ELIGIBLE"|"NO_EMAIL"|"UNSUBSCRIBED"|"BOUNCED"|"NOT_NOW" {
  if(value.unsubscribedAt)return "UNSUBSCRIBED";
  if(!value.emailNorm?.trim())return "NO_EMAIL";
  if(value.inviteBouncedAt)return "BOUNCED";
  if(value.manualStage==="NOT_NOW")return "NOT_NOW";
  return "ELIGIBLE";
}
export function assertCampaignRecipientCap(total:number):number {
  if(!Number.isSafeInteger(total)||total<0||total>TPO_CAMPAIGN_MAX_RECIPIENTS)
    throw new Error("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  return total;
}
