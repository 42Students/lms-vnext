import { describe, expect, it } from "vitest";
import {
  issueTpoCampaignRecipientToken, verifyTpoCampaignRecipientToken,
} from "@/modules/messaging/tpo-campaign-recipient-token";
import { issueUnsubscribeToken } from "@/modules/messaging/unsubscribe-model";

const key = "this-test-only-token-secret-is-at-least-32-chars";
const now = Date.UTC(2026, 9, 16);
const claim = {
  v: 1 as const,
  collegeId: "82c8dd13-437a-468e-bcd4-6d4b311cf95c",
  campaignId: "3d02927d-47ba-475d-b471-744a98a78f74",
  recipientId: "efcfd479-43cc-4c5d-ab2f-2ee6593800db",
  expiresAt: now + 24 * 60 * 60 * 1000,
};
describe("TPO-campaigns-public-13 recipient token family", () => {
  it("accepts only its purpose-specific signature and preserves historic opt-out after the claim timestamp", () => {
    const token = issueTpoCampaignRecipientToken(claim, key);
    expect(verifyTpoCampaignRecipientToken(token, key, now)).toEqual(claim);
    expect(verifyTpoCampaignRecipientToken(token, key, claim.expiresAt)).toEqual(claim);
    // Signed historical links must remain usable to withdraw consent.
    expect(verifyTpoCampaignRecipientToken(token, "other-" + key, now)).toBeNull();
    expect(verifyTpoCampaignRecipientToken(token + "x", key, now)).toBeNull();
  });
  it("cannot mistake a global-email token for a TPO campaign token", () => {
    const global = issueUnsubscribeToken({
      version: 1, recipientKey: "f".repeat(64), expiresAt: claim.expiresAt,
    }, key);
    expect(verifyTpoCampaignRecipientToken(global, key, now)).toBeNull();
  });
});
