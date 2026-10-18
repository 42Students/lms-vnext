import "server-only";
import { verifyUnsubscribeToken } from "@/modules/messaging/unsubscribe-model";
import { verifyTpoCampaignRecipientToken,resolveTpoCampaignRecipientSecret } from "@/modules/messaging/tpo-campaign-recipient-token";

export type CampaignUnsubscribeTokenKind = "PLACEMENT_CELL" | "GLOBAL";

/** GET never persists suppression; it only validates the purpose-specific signed token. */
export async function campaignUnsubscribeTokenKind(
  token: string,
): Promise<CampaignUnsubscribeTokenKind | null> {
  if (token.length > 2048) return null;
  const now = Date.now();
  if (verifyTpoCampaignRecipientToken(
    token, resolveTpoCampaignRecipientSecret(process.env), now,
  )) return "PLACEMENT_CELL";
  if (verifyUnsubscribeToken(
    token, process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64 ?? "", now,
  )) return "GLOBAL";
  return null;
}
export async function canPreviewCampaignUnsubscribe(token: string): Promise<boolean> {
  return (await campaignUnsubscribeTokenKind(token)) !== null;
}
