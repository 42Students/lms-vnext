import {createHmac,timingSafeEqual} from "node:crypto";
import {z} from "zod";

const payload=z.object({
  v:z.literal(1),
  collegeId:z.string().uuid(),
  campaignId:z.string().uuid(),
  recipientId:z.string().uuid(),
  expiresAt:z.number().int().positive(),
}).strict();
export type TpoCampaignRecipientClaim=z.infer<typeof payload>;

/** T-S2-04: separate purpose key so global email opt-outs cannot impersonate campaign recipients. */
function signature(body:string,secret:string) {
  if(Buffer.byteLength(secret,"utf8")<32)throw new Error("CAMPAIGN_RECIPIENT_SECRET_UNAVAILABLE");
  return createHmac("sha256",secret)
    .update("tpo-campaign-recipient-unsubscribe-v1:").update(body).digest();
}

export function issueTpoCampaignRecipientToken(
  claim:TpoCampaignRecipientClaim,secret:string,
):string {
  const body=Buffer.from(JSON.stringify(payload.parse(claim))).toString("base64url");
  return body+"."+signature(body,secret).toString("base64url");
}

export function verifyTpoCampaignRecipientToken(
  value:string,secret:string,nowMs:number,
):TpoCampaignRecipientClaim|null {
  if(typeof value!=="string"||value.length>2048||!Number.isFinite(nowMs))return null;
  const [body,mac,...extra]=value.split(".");
  if(!body||!mac||extra.length||!(/^[A-Za-z0-9_-]+$/).test(body)||
    !(/^[A-Za-z0-9_-]+$/).test(mac))return null;
  try {
    const raw=Buffer.from(body,"base64url");
    const macBytes=Buffer.from(mac,"base64url");
    if(raw.toString("base64url")!==body||macBytes.toString("base64url")!==mac)return null;
    const expected=signature(body,secret);
    if(macBytes.length!==expected.length||!timingSafeEqual(macBytes,expected))return null;
    const claim=payload.parse(JSON.parse(raw.toString("utf8")));
    // An unsubscribe link must keep working for a verified recipient even
    // after the associated campaign is old. The purpose-specific HMAC and
    // locked college/campaign/recipient check still guard the mutation.
    // expiresAt remains in v1 claims for backwards-compatible parsing.
    return claim;
  }catch{return null;}
}

/** Signed identity is never sufficient alone: the campaign-recipient row must
 * still be checked in a locked, college-constrained transaction. */
export function matchesCampaignRecipient(
  claim:TpoCampaignRecipientClaim,
  persisted:{collegeId:string;campaignId:string;id:string;unsubscribedAt:Date|null},
):boolean {
  return claim.collegeId===persisted.collegeId &&
    claim.campaignId===persisted.campaignId &&
    claim.recipientId===persisted.id;
}

export function campaignUnsubscribeDecision(
  claim:TpoCampaignRecipientClaim,
  persisted:{collegeId:string;campaignId:string;id:string;unsubscribedAt:Date|null},
):"DENY"|"ALREADY"|"APPLY" {
  if(!matchesCampaignRecipient(claim,persisted))return "DENY";
  return persisted.unsubscribedAt ? "ALREADY" : "APPLY";
}
