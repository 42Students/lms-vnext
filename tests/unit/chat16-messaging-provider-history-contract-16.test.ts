import { afterEach, describe, expect, it, vi } from "vitest";
import { readOutboundProviderConfig } from "@/modules/messaging/providers";
import { tpoCampaignDispatchReady } from "@/modules/messaging/tpo-campaign-dispatch-service";
import { isExotelAcceptedResponse } from "@/modules/messaging/provider-acceptance-model";
import {
  resolveTpoCampaignRecipientSecret,
} from "@/modules/messaging/tpo-campaign-recipient-token";
import {
  messagingHistoryQuerySchema, projectMessagingHistory,
} from "@/modules/messaging/receipt-history-model";

afterEach(() => vi.unstubAllEnvs());

describe("chat-16 campaign provider and aggregate history export boundaries", () => {
  it("MESSAGING-CONFIG-16 resolves only canonical campaign secret before legacy fallback", () => {
    const env = {
      TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET: "canonical-secret",
      TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET: "legacy-secret",
    };
    expect(resolveTpoCampaignRecipientSecret(env)).toBe("canonical-secret");
    expect(resolveTpoCampaignRecipientSecret({
      TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET: "legacy-secret",
    })).toBe("legacy-secret");
    expect(resolveTpoCampaignRecipientSecret({
      TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET: "",
      TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET: "legacy-secret",
    })).toBe("");
    expect(resolveTpoCampaignRecipientSecret({})).toBe("");
  });

  it("MESSAGING-PROVIDER-CONFIG-16 derives provider credentials only from environment and retains registered templates", () => {
    vi.stubEnv("ZEPTOMAIL_TOKEN", "test-only-provider-token");
    vi.stubEnv("EXOTEL_API_KEY", "test-only-key");
    vi.stubEnv("EXOTEL_API_TOKEN", "test-only-sms-token");
    const templates = {
      "recruiter.digest": { zeptoTemplateKey: "campaign.tpo" },
    };
    const configured = readOutboundProviderConfig(templates);
    expect(configured.templates).toBe(templates);
    expect(configured.email.token).toBe("test-only-provider-token");
    expect(configured.sms.apiKey).toBe("test-only-key");
    expect(configured.sms.apiToken).toBe("test-only-sms-token");
  });

  it("MESSAGING-DISPATCH-READY-16 never claims readiness without an explicit campaign provider deployment", async () => {
    vi.stubEnv("TPO_CAMPAIGNS_READY", "");
    vi.stubEnv("TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY", "");
    await expect(tpoCampaignDispatchReady()).resolves.toBe(false);
    vi.stubEnv("TPO_CAMPAIGNS_READY", "VERIFIED");
    vi.stubEnv("TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY", "auth.otp");
    await expect(tpoCampaignDispatchReady()).resolves.toBe(false);
  });

  it("MESSAGING-EXOTEL-ACCEPT-16 requires real SID and affirmative provider state", () => {
    for (const status of ["queued", "submitted", "sent", "accepted", "delivered", " QUEUED "]) {
      expect(isExotelAcceptedResponse({
        SMSMessage: { Sid: "SM-123", Status: status },
      })).toBe(true);
    }
    for (const response of [
      null, 200, {}, { SMSMessage: null }, { SMSMessage: { Status: "sent" } },
      { SMSMessage: { Sid: "SM-123" } },
      { SMSMessage: { Sid: "SM-123", Status: "failed" } },
      { SMSMessage: { Sid: "SM-123", Status: "queued-but-invalid" } },
      { SMSMessage: { Sid: "SM/unsafe", Status: "queued" } },
    ]) expect(isExotelAcceptedResponse(response)).toBe(false);
  });

  it("MESSAGING-HISTORY-PROJECTION-16 distinguishes provider acceptance from confirmed delivery and filters invalid queries", () => {
    expect(messagingHistoryQuerySchema.parse({})).toEqual({ page: 1 });
    expect(messagingHistoryQuerySchema.parse({ page: "2", purpose: " Campaign " }))
      .toEqual({ page: 2, purpose: "Campaign" });
    for (const input of [
      { page: 0 }, { page: 10001 }, { page: "NaN" },
      { purpose: "x".repeat(161) }, { collegeId: "other" },
    ]) expect(messagingHistoryQuerySchema.safeParse(input).success).toBe(false);
    const createdAt = new Date("2026-10-18T00:00:00.000Z");
    const rows = [
      { id: "a", purpose: "HR campaign", total: 2, queued: 1,
        sent: 1, failed: 0, suppressed: 0, createdAt, finalizedAt: null },
      { id: "b", purpose: "TPO digest", total: 1, queued: 0,
        sent: 1, failed: 0, suppressed: 0, createdAt, finalizedAt: createdAt },
    ];
    expect(projectMessagingHistory(rows)).toEqual([
      { id: "a", purpose: "HR campaign", total: 2, queued: 1,
        acceptedByProvider: 1, failed: 0, suppressed: 0,
        createdAt, finalizedAt: null, status: "IN_PROGRESS" },
      { id: "b", purpose: "TPO digest", total: 1, queued: 0,
        acceptedByProvider: 1, failed: 0, suppressed: 0,
        createdAt, finalizedAt: createdAt, status: "FINALIZED" },
    ]);
    for (const item of projectMessagingHistory(rows)) {
      expect(item).not.toHaveProperty("recipientKey");
      expect(item).not.toHaveProperty("delivered");
    }
  });
});
