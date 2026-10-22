import { describe, expect, it, vi } from "vitest";
import { deliverBatch, validOutboundBatchId, type DeliveryRecord, type DeliveryRepository } from "@/modules/messaging/service";
import type { DeliveryPolicy, OutboundSendRequest } from "@/modules/messaging/model";

const email = (recipient: string): OutboundSendRequest => ({
  channel: "EMAIL", recipient, templateKey: "campaign.notice",
  variables: { firstName: "Learner" }, purpose: "placement-update",
});
const policy = (overrides: Partial<DeliveryPolicy> = {}): DeliveryPolicy => ({
  appEnv: "production", testEmails: [], testPhones: [], suppressed: new Set<string>(),
  sentToday: 0, dailyCap: 100, recentRecipientSends: 0, recipientWindowCap: 2,
  ...overrides,
});
const key = async (request: OutboundSendRequest) => {
  const normalized = request.recipient.trim().toLowerCase();
  return normalized === "a@example.org" ? "a".repeat(64) :
    normalized === "b@example.org" ? "b".repeat(64) : "c".repeat(64);
};
function fixture() {
  const inserted: DeliveryRecord[] = [];
  const updated: DeliveryRecord[] = [];
  const audits: Array<{ batchId: string; sent: number; failed: number; suppressed: number }> = [];
  const repository: DeliveryRepository = {
    async insert(record) { inserted.push({ ...record }); },
    async update(record) { updated.push({ ...record }); },
    async auditBatch(batchId, summary) { audits.push({ batchId, ...summary }); },
  };
  const send = vi.fn(async (_: OutboundSendRequest) => true);
  const deliver = (requests: readonly OutboundSendRequest[],
    policyFor: (request: OutboundSendRequest) => Promise<DeliveryPolicy> = async () => policy()) =>
      deliverBatch({
        batchId: "campaign-2026-10-18", requests, provider: { send },
        repository, policyFor, recipientKeyFor: key,
        runtimeEnv: { APP_ENV: "production" },
      });
  return { inserted, updated, audits, send, deliver, repository };
}

describe("chat-16 messaging delivery: per-channel failures, dedupe, authorization and audit", () => {
  it("MSG-CHANNEL-FAIL-01 continues other recipients after a channel exception without raw error", async () => {
    const ctx = fixture();
    ctx.send.mockRejectedValueOnce(new Error("provider-secret user@hidden.example"))
      .mockResolvedValueOnce(true);
    const results = await ctx.deliver([email("a@example.org"), email("b@example.org")]);
    expect(results.map(x => x.status)).toEqual(["QUEUED", "SENT"]);
    expect(results[0].reason).toBe("provider-result-unknown");
    expect(ctx.inserted.map(x => x.status)).toEqual(["QUEUED", "QUEUED"]);
    expect(ctx.updated.map(x => x.status)).toEqual(["QUEUED", "SENT"]);
    expect(ctx.audits).toEqual([{ batchId: "campaign-2026-10-18", sent: 1, failed: 0, suppressed: 0 }]);
    expect(JSON.stringify([...ctx.updated, ...ctx.audits])).not.toContain("provider-secret");
    expect(JSON.stringify([...ctx.updated, ...ctx.audits])).not.toContain("a@example.org");
    expect(ctx.send).toHaveBeenCalledTimes(2);
  });

  it("MSG-ONCE-01 suppresses duplicate contact+purpose+template in one batch", async () => {
    const ctx = fixture();
    const result = await ctx.deliver([email("A@example.org"), email("a@example.org")]);
    expect(result.map(x => x.status)).toEqual(["SENT", "SUPPRESSED"]);
    expect(result[1]).toMatchObject({ reason: "duplicate-in-batch" });
    expect(ctx.send).toHaveBeenCalledTimes(1);
    expect(ctx.audits[0]).toMatchObject({ sent: 1, suppressed: 1 });
  });

  it("MSG-POLICY-RECHECK-01 refuses dispatch after unsubscribe between persistence and send", async () => {
    const ctx = fixture();
    let lookups = 0;
    const results = await ctx.deliver([email("a@example.org")], async () => {
      lookups++;
      return policy(lookups === 2 ? {
        suppressed: new Set(["EMAIL:a@example.org"]),
      } : {});
    });
    expect(lookups).toBe(2);
    expect(ctx.inserted[0].status).toBe("QUEUED");
    expect(results[0]).toMatchObject({ status: "SUPPRESSED", reason: "unsubscribed" });
    expect(ctx.send).not.toHaveBeenCalled();
    expect(ctx.audits[0]).toMatchObject({ sent: 0, suppressed: 1 });
  });

  it("MSG-POLICY-RECHECK-02 a failed recheck does not accidentally send", async () => {
    const ctx = fixture();
    let attempts = 0;
    const result = await ctx.deliver([email("a@example.org")], async () => {
      if (++attempts === 2) throw new Error("database-down");
      return policy();
    });
    expect(result[0]).toMatchObject({ status: "FAILED", reason: "policy-recheck-failed" });
    expect(ctx.send).not.toHaveBeenCalled();
    expect(ctx.audits[0]).toMatchObject({ failed: 1 });
  });

  it("MSG-CAP-01 enforces daily cap across recipients in one dispatch", async () => {
    const ctx = fixture();
    const result = await ctx.deliver([
      email("a@example.org"), email("b@example.org"), email("c@example.org"),
    ], async () => policy({ dailyCap: 1 }));
    expect(result.map(x => x.status)).toEqual(["SENT", "SUPPRESSED", "SUPPRESSED"]);
    expect(result.slice(1).every(x => x.reason === "daily-cap")).toBe(true);
    expect(ctx.send).toHaveBeenCalledTimes(1);
  });

  it("MSG-INVALID-01 validates the entire batch and opaque recipient keys before any side effect", async () => {
    expect(validOutboundBatchId("../leak")).toBe(false);
    expect(validOutboundBatchId("campaign-1")).toBe(true);
    const ctx = fixture();
    await expect(ctx.deliver([email("a@example.org"), {
      ...email("b@example.org"), variables: { unsupported: "x".repeat(12001) },
    }])).rejects.toThrow();
    expect(ctx.inserted).toHaveLength(0);
    expect(ctx.send).not.toHaveBeenCalled();
    expect(ctx.audits).toHaveLength(0);
    const keyless = deliverBatch({
      batchId: "campaign-2026-10-18", requests: [email("a@example.org")],
      provider: { send: ctx.send }, repository: ctx.repository,
      policyFor: async () => policy(), recipientKeyFor: async () => "raw-email",
      runtimeEnv: { APP_ENV: "production" },
    });
    await expect(keyless).rejects.toThrow("INVALID_RECIPIENT_KEY");
    expect(ctx.send).not.toHaveBeenCalled();
  });

  it("MSG-ALLOWLIST-01 suppression is checked even when caller returns permissive policy", async () => {
    const ctx = fixture();
    const result = await deliverBatch({
      batchId: "campaign-2026-10-18", requests: [email("a@example.org")],
      provider: { send: ctx.send }, repository: ctx.repository,
      policyFor: async () => policy(), recipientKeyFor: key,
      runtimeEnv: { APP_ENV: "staging", AUTH_TEST_EMAILS: "b@example.org" },
    });
    expect(result[0]).toMatchObject({ status: "SUPPRESSED", reason: "nonprod-not-allowlisted" });
    expect(ctx.send).not.toHaveBeenCalled();
  });
});
