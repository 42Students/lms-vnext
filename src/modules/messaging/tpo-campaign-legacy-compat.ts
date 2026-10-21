/** Legacy Engage campaign crosswalk. These are not aliases that bypass the
 * scoped vNext routes; create and dispatch remain separate authenticated writes. */
export const LEGACY_TPO_CAMPAIGN_ROUTES = {
 history: {legacy:"GET /api/v1/tpo/campaigns",current:"GET /api/placements/tpo/campaigns/history"},
 create: {legacy:"POST /api/v1/tpo/campaigns",current:"POST /api/placements/tpo/campaigns/drafts"},
 send: {legacy:"POST /api/v1/tpo/campaigns",current:"POST /api/placements/tpo/campaigns/drafts/[campaignId]/send"},
} as const;
export const TPO_CAMPAIGN_RECIPIENT_CAP_COPY =
 "Select up to 100 recruiter leads in one selection. A campaign can send to up to 500 distinct, currently eligible email addresses after opt-out, bounce and duplicate suppression.";
export const TPO_CAMPAIGN_PROVIDER_DISABLED_COPY =
 "Your draft remains saved when email delivery is disabled. Nothing was sent. Once a verified campaign email provider is enabled, reopen the draft to review recipients and send; never retry a campaign already sending.";

/** Explicit HTTPS public origin for purpose-bound unsubscribe links.
 * Never build token links from an inbound Host or tenant-supplied header. */
export function verifiedTpoCampaignPublicOrigin(value:string):string|null{
 try {
  const parsed=new URL(value);
  if(parsed.protocol!=="https:"||!parsed.hostname||parsed.username||parsed.password||
     parsed.search||parsed.hash||parsed.pathname!=="/" ||
     ["localhost","127.0.0.1","::1"].includes(parsed.hostname.toLowerCase()))
   return null;
  return parsed.origin;
 }catch{return null;}
}

/** Import-only projection: historical campaign rows are NOT send commands.
 * Preserve statuses/counts; do not migrate raw unsubscribe tokens, SMTP
 * credentials or recipient addresses into receipt metadata. */
export function mapLegacyTpoRecipientOutcome(status:string):
  "SENT"|"FAILED"|"SUPPRESSED"|"QUEUED"{
 switch(status.trim().toUpperCase()){
  case "SENT":return "SENT";
  case "FAILED":return "FAILED";
  case "SKIPPED":case "UNSUBSCRIBED":return "SUPPRESSED";
  default:return "QUEUED";
 }
}
