import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import {
  unsubscribeTpoCampaignRecipient,
} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import { issueTpoCampaignRecipientToken } from "@/modules/messaging/tpo-campaign-recipient-token";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

const secret = "strong-campaign-token-secret".repeat(2);
const claim = {
  v: 1 as const,
  collegeId: "11111111-1111-4111-8111-111111111111",
  campaignId: "22222222-2222-4222-8222-222222222222",
  recipientId: "33333333-3333-4333-8333-333333333333",
  expiresAt: Date.now() + 60_000,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET", secret);
 vi.stubEnv("DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 purpose-bound unsubscribe gate before storage access", () => {
  it("T-S2-04-UNSUB-01 malformed, wrong-secret and unsigned links cannot query private recipient storage", async () => {
    const signed = issueTpoCampaignRecipientToken(claim, secret);
    for (const token of [
      "", "not-a-token", "not-a-token.segment",
      signed + ".replayed", signed.slice(0, -1) + (signed.endsWith("x") ? "y" : "x"),
      "x".repeat(2049),
      issueTpoCampaignRecipientToken(claim, "wrong-secret".repeat(5)),
    ]) {
      // All rejected link inputs have the same idempotent outward response.
      // They must not reach a private recipient read or send a notification.
      await expect(unsubscribeTpoCampaignRecipient(token))
        .resolves.toEqual({unsubscribed:true});
    }
    expect(getDb).not.toHaveBeenCalled();
  });

  it("T-S2-04-UNSUB-02 valid token checks storage availability before locking or modifying preferences", async () => {
    const execute = vi.fn(async () => ({ rows: [{ ready: false }] }));
    const transaction = vi.fn();
    vi.mocked(getDb).mockReturnValue({ execute, transaction } as never);
    await expect(unsubscribeTpoCampaignRecipient(issueTpoCampaignRecipientToken(claim, secret)))
      .rejects.toThrow("TPO_CAMPAIGNS_NOT_REGISTERED");
    expect(execute).toHaveBeenCalledTimes(1);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("T-S2-04-UNSUB-03 a broken storage probe never returns a false confirmed opt-out", async () => {
    vi.mocked(getDb).mockReturnValue({
      execute: vi.fn(async () => { throw new Error("temporary database outage"); }),
      transaction: vi.fn(),
    } as never);
    await expect(unsubscribeTpoCampaignRecipient(issueTpoCampaignRecipientToken(claim, secret)))
      .rejects.toThrow("temporary database outage");
  });
  it("T-S2-04-UNSUB-04 already unsubscribed recipient is idempotent and never issues another write", async () => {
    const limit = vi.fn(async () => [{
      id: claim.recipientId, campaignId: claim.campaignId,
      collegeId: claim.collegeId, unsubscribedAt: new Date(),
    }]);
    const where = vi.fn(() => ({ orderBy: vi.fn(() => ({
      for: vi.fn(() => ({ limit })),
    })) }));
    const tx = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
      update: vi.fn(),
      insert: vi.fn(),
    };
    const execute = vi.fn(async () => ({ rows: [{ ready: true }] }));
    const transaction = vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) =>
      operation(tx));
    vi.mocked(getDb).mockReturnValue({ execute, transaction } as never);
    const result = await unsubscribeTpoCampaignRecipient(
      issueTpoCampaignRecipientToken(claim, secret),
    );
    expect(result).toEqual({ unsubscribed: true });
    expect(limit).toHaveBeenCalledWith(1);
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("T-S2-04-UNSUB-05 forged cross-college recipient ID returns indistinguishable success without writing", async () => {
    const limit = vi.fn(async () => []);
    const tx = {
      select: vi.fn(() => ({ from: vi.fn(() => ({
        where: vi.fn(() => ({ orderBy: vi.fn(() => ({
          for: vi.fn(() => ({ limit })),
        })) })),
      })) })),
      update: vi.fn(),
      insert: vi.fn(),
    };
    vi.mocked(getDb).mockReturnValue({
      execute: vi.fn(async () => ({ rows: [{ ready: true }] })),
      transaction: vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) =>
        operation(tx)),
    } as never);
    await expect(unsubscribeTpoCampaignRecipient(issueTpoCampaignRecipientToken(claim, secret)))
      .resolves.toEqual({unsubscribed:true});
    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

});
