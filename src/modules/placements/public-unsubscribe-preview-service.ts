import "server-only";
import { verifyUnsubscribeToken } from "@/modules/messaging/unsubscribe-model";
import { verifyTpoCampaignRecipientToken,resolveTpoCampaignRecipientSecret } from "@/modules/messaging/tpo-campaign-recipient-token";

export type CampaignUnsubscribeTokenKind = "PLACEMENT_CELL" | "GLOBAL";

/** GET never persists suppression; it only validates the purpose-specific signed token. */
export async function campaignUnsubscribeTokenKind(
  token: string,
): Promise<CampaignUnsubscribeTokenKind | null> {
  // The legacy pre-HMAC links are opaque strings (1–200 chars) stored as
  // SHA-256 digests on migrated recipient rows. The POST handler treats
  // unknown and already-used links identically; preview must not become an
  // existence oracle or force those historic users into an error page.
  if (!token || token.length > 2048) return null;
  const now = Date.now();
  if (verifyTpoCampaignRecipientToken(
    token, resolveTpoCampaignRecipientSecret(process.env), now,
  )) return "PLACEMENT_CELL";
  if (verifyUnsubscribeToken(
    token, process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"] ?? "", now,
  )) return "GLOBAL";
  if (token.length <= 200 && !token.includes(".") && token.trim() === token)
    return "PLACEMENT_CELL";
  return null;
}
export async function canPreviewCampaignUnsubscribe(token: string): Promise<boolean> {
  return (await campaignUnsubscribeTokenKind(token)) !== null;
}
