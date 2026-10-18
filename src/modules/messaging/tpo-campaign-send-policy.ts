import {isValidRecipient} from "./model";

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
  if(!value.emailNorm?.trim() || !isValidRecipient("EMAIL",value.emailNorm.trim()))return "NO_EMAIL";
  if(value.inviteBouncedAt)return "BOUNCED";
  if(value.manualStage==="NOT_NOW")return "NOT_NOW";
  return "ELIGIBLE";
}
export function assertCampaignRecipientCap(total:number):number {
  if(!Number.isSafeInteger(total)||total<0||total>TPO_CAMPAIGN_MAX_RECIPIENTS)
    throw new Error("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  return total;
}

/** T-S2-04: a dry-run snapshot, never authority to send. The eventual
 * delivery worker must re-read live suppression and verify actor/college.
 * Returning IDs and counts (not contact addresses) prevents accidental PII
 * disclosure through campaign preview pages.
 */
export function planTpoCampaignRecipients<T extends CampaignRecipientFact & {id:string}>(
  candidates:readonly T[],
):{recipientIds:string[];suppressed:Record<Exclude<ReturnType<typeof campaignRecipientDisposition>,"ELIGIBLE">|"DUPLICATE",number>} {
  // The 500 limit is on unique eligible recipients, not the whole CRM roster.
  // A roster with 600 unsubscribed contacts and 1 eligible lead is sendable.
  const suppressed={NO_EMAIL:0,UNSUBSCRIBED:0,BOUNCED:0,NOT_NOW:0,DUPLICATE:0};
  const seen=new Set<string>();
  const recipientIds:string[]=[];
  for(const row of candidates){
    const state=campaignRecipientDisposition(row);
    if(state!=="ELIGIBLE"){suppressed[state]++;continue;}
    const email=row.emailNorm!.trim().toLowerCase();
    if(seen.has(email)){suppressed.DUPLICATE++;continue;}
    seen.add(email);
    assertCampaignRecipientCap(recipientIds.length+1);
    recipientIds.push(row.id);
  }
  return {recipientIds,suppressed};
}

/** A campaign snapshot authorizes no future send by itself. Re-read the live
 * lead before dispatch, and never redirect a queued campaign to a changed
 * contact address without a fresh opt-in and snapshot. */
export function campaignRecipientStillMatchesSnapshot(
 snapshot:CampaignRecipientFact,live:CampaignRecipientFact|null|undefined,
):boolean{
 if(!live||campaignRecipientDisposition(live)!=="ELIGIBLE")return false;
 const before=snapshot.emailNorm?.trim().toLowerCase();
 const now=live.emailNorm?.trim().toLowerCase();
 return Boolean(before&&now&&before===now);
}
