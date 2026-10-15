import { describe, expect, it } from "vitest";
import { decideDelivery, outboundSendSchema, previewAudience, type DeliveryPolicy } from "@/modules/messaging/model";
import { deliverBatch } from "@/modules/messaging/service";

const email = outboundSendSchema.parse({ channel: "EMAIL", recipient: "PERSON@EXAMPLE.COM", templateKey: "campaign", variables: {}, purpose: "recruiter-campaign" });
const policy: DeliveryPolicy = { appEnv: "development", testEmails: ["person@example.com"], testPhones: ["+919999999999"], suppressed: new Set(), sentToday: 0, dailyCap: 100, recentRecipientSends: 0, recipientWindowCap: 3 };
describe("outbound messaging safety", () => {
  it("suppresses every non-production recipient outside the test allowlist", () => {
    expect(decideDelivery({ ...email, recipient: "real@example.com" }, policy)).toEqual({ status: "SUPPRESSED", reason: "nonprod-not-allowlisted" });
    expect(decideDelivery(email, policy)).toEqual({ status: "QUEUED" });
    expect(decideDelivery({ ...email, channel: "SMS", recipient: "+919888888888" }, policy)).toEqual({ status: "SUPPRESSED", reason: "nonprod-not-allowlisted" });
  });
  it("suppresses unsubscribed recipients and respects caps", () => {
    expect(decideDelivery(email, { ...policy, suppressed: new Set(["EMAIL:person@example.com"]) })).toEqual({ status: "SUPPRESSED", reason: "unsubscribed" });
    expect(decideDelivery(email, { ...policy, sentToday: 100 })).toEqual({ status: "SUPPRESSED", reason: "daily-cap" });
    expect(decideDelivery(email, { ...policy, recentRecipientSends: 3 })).toEqual({ status: "SUPPRESSED", reason: "rate-limited" });
    expect(decideDelivery(email, { ...policy, appEnv: undefined, testEmails: [] })).toEqual({ status: "SUPPRESSED", reason: "nonprod-not-allowlisted" });
  });
  it("previews one outcome per recipient without dispatching", () => {
    expect(previewAudience([email, { ...email, recipient: "stranger@example.com" }], () => policy).map(item => item.status)).toEqual(["QUEUED", "SUPPRESSED"]);
  });
  it("persists suppression without invoking a provider and audits the batch", async () => {
    const inserts: string[] = [];
    const updates: string[] = [];
    const audits: unknown[] = [];
    const result = await deliverBatch({
      batchId: "batch-1",
      requests: [{ ...email, recipient: "stranger@example.com" }],
      policyFor: async () => policy,
      recipientKeyFor: async () => "opaque-test-key",
      provider: { send: async () => { throw new Error("must never send"); } },
      repository: {
        insert: async row => { inserts.push(row.status); },
        update: async row => { updates.push(row.status); },
        auditBatch: async (_id, summary) => { audits.push(summary); },
      },
    });
    expect(inserts).toEqual(["SUPPRESSED"]);
    expect(updates).toEqual([]);
    expect(audits).toEqual([{ sent: 0, failed: 0, suppressed: 1 }]);
    expect(result[0]?.reason).toBe("nonprod-not-allowlisted");
  });
});
