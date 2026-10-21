import {isValidRecipient} from "./model";

/** Global email suppression is independent of college-local lead opt-out:
 * the dispatch worker must resolve the stable recipient HMAC from the
 * normalized live address and read the ACTIVE global suppression row just
 * before provider send. A missing table/key/query result is UNKNOWN, not
 * implied clearance. Do not use a tenant-scoped hash as the global key. */
export type CampaignGlobalSuppressionState="CLEAR"|"SUPPRESSED"|"UNKNOWN";
export function campaignGlobalEmailSuppressionPermitsDispatch(
 state:CampaignGlobalSuppressionState,
):boolean{
 return state==="CLEAR";
}

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
):{recipientIds:string[];selectedCount:number;eligibleCount:number;
 suppressed:Record<Exclude<ReturnType<typeof campaignRecipientDisposition>,"ELIGIBLE">|"DUPLICATE",number>} {
  // The old 500-person selection cap includes unsubscribed contacts.
  // This list is the chosen subset, never the whole CRM directory.
  assertCampaignRecipientCap(candidates.length);
  const suppressed={NO_EMAIL:0,UNSUBSCRIBED:0,BOUNCED:0,NOT_NOW:0,DUPLICATE:0};
  const seen=new Set<string>();
  const seenIds=new Set<string>();
  const recipientIds:string[]=[];
  for(const row of candidates){
    const state=campaignRecipientDisposition(row);
    if(state!=="ELIGIBLE"){suppressed[state]++;continue;}
    const email=row.emailNorm!.trim().toLowerCase();
    if(seen.has(email)||seenIds.has(row.id)){suppressed.DUPLICATE++;continue;}
    seen.add(email);
    seenIds.add(row.id);
    assertCampaignRecipientCap(recipientIds.length+1);
    recipientIds.push(row.id);
  }
  return {recipientIds,selectedCount:candidates.length,
    eligibleCount:recipientIds.length,suppressed};
}

/** A campaign snapshot authorizes no future send by itself. Re-read the live
 * lead before dispatch, and never redirect a queued campaign to a changed
 * contact address without a fresh opt-in and snapshot. */
export function campaignRecipientStillMatchesSnapshot(
 snapshot:CampaignRecipientFact,live:CampaignRecipientFact|null|undefined,
):boolean{
 if(campaignRecipientDisposition(snapshot)!=="ELIGIBLE"||
    !live||campaignRecipientDisposition(live)!=="ELIGIBLE")return false;
 const before=snapshot.emailNorm?.trim().toLowerCase();
 const now=live.emailNorm?.trim().toLowerCase();
 return Boolean(before&&now&&before===now);
}
