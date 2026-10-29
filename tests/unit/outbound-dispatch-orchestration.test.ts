import { describe, expect, it } from "vitest";
import {
  executeClaimedOutbound,
  type OutboundClaim,
  type OutboundDispatchPort,
  type OpenedOutboundClaim,
  type TrustedProviderResult,
} from "@/modules/operations/outbound-dispatch-orchestration";
import type { OutboundDeliveryIntent } from "@/modules/operations/outbound-delivery-contract";

const claim: OutboundClaim = {
  messageId: "10000000-0000-4000-8000-000000000001",
  fence: 3,
  requestDigest: "c".repeat(64),
};
const intent: OutboundDeliveryIntent = {
  organizationId: "20000000-0000-4000-8000-000000000001",
  collegeId: "30000000-0000-4000-8000-000000000001",
  sourceEventId: "40000000-0000-4000-8000-000000000001",
  channel: "EMAIL",
  templateKey: "RECRUITER_INVITATION",
  recipient: "privacy@example.test",
  variables: {
    collegeName: "College",
    companyName: "Employer",
    invitationUrl: "https://invites.example.test/accept?token=PRIVATE",
  },
};
const opened: OpenedOutboundClaim = {
  intent, attempts: 1, globalEmailHash: "d".repeat(64),
};
const fixedTime = new Date("2026-10-29T02:00:00.000Z");

function fixture(config: {
  authorized?: boolean;
  load?: OpenedOutboundClaim | null;
  result?: TrustedProviderResult;
  sendThrows?: boolean;
  completeOk?: boolean;
  loadThrows?: boolean;
} = {}) {
  const calls: string[] = [];
  const completion: unknown[] = [];
  const port: OutboundDispatchPort = {
    load: async () => {
      calls.push("load");
      if (config.loadThrows) throw new Error("PRIVATE LOAD ERROR");
      return config.load === undefined ? opened : config.load;
    },
    authorize: async (input) => {
      calls.push("authorize");
      expect(input).toEqual({
        messageId: claim.messageId, worker: "worker-01",
        fence: claim.fence, globalEmailHash:
          (config.load === undefined ? opened : config.load)?.globalEmailHash,
      });
      return config.authorized ?? true;
    },
    send: async (actual) => {
      calls.push("send");
      expect(actual).toEqual(intent);
      if (config.sendThrows) throw new Error("PRIVATE PROVIDER RESPONSE");
      return config.result ?? { kind: "ACCEPTED", providerMessageId: "provider-123" };
    },
    complete: async (value) => {
      calls.push("complete");
      completion.push(value);
      return config.completeOk ?? true;
    },
    now: () => fixedTime,
  };
  return { calls, completion, port };
}

describe("DB-067 outbound worker cannot silently double-send", () => {
  it("refuses malformed worker/claim before loading secrets or calling provider", async () => {
    const { port, calls } = fixture();
    expect(await executeClaimedOutbound(
      { ...claim, requestDigest: "invalid" }, "worker-01", port,
    )).toBe("RECONCILIATION_REQUIRED");
    expect(await executeClaimedOutbound(claim, "bad worker", port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(calls).toEqual([]);
  });

  it("never sends if exact-fence pre-send authorization fails", async () => {
    const { port, calls } = fixture({ authorized: false });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("NOT_AUTHORIZED");
    expect(calls).toEqual(["load", "authorize"]);
  });

  it("orders decrypt/load, late opt-out check, provider handoff, and exact-fence completion", async () => {
    const { port, calls, completion } = fixture();
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("PROVIDER_ACCEPTED");
    expect(calls).toEqual(["load", "authorize", "send", "complete"]);
    expect(completion).toEqual([{
      messageId: claim.messageId, worker: "worker-01", fence: 3,
      outcome: "PROVIDER_ACCEPTED", providerMessageId: "provider-123",
    }]);
  });

  it("quarantines uncertain network outcomes without resubmitting or marking failed", async () => {
    const { port, calls } = fixture({ result: { kind: "UNKNOWN" } });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(calls).toEqual(["load", "authorize", "send"]);
  });

  it("quarantines a thrown provider call because send acceptance is unknowable", async () => {
    const { port, calls } = fixture({ sendThrows: true });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(calls).toEqual(["load", "authorize", "send"]);
  });

  it("retries only definitely-unsent attempts, with bounded backoff", async () => {
    const { port, completion } = fixture({
      result: { kind: "DEFINITELY_UNSENT_RETRYABLE" },
    });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RETRY_SCHEDULED");
    expect(completion).toEqual([{
      messageId: claim.messageId, worker: "worker-01", fence: 3,
      outcome: "RETRY", safeFailureCode: "CONFIRMED_NOT_SENT",
      nextAttemptAt: new Date("2026-10-29T02:01:00.000Z"),
    }]);
  });

  it("does not schedule a definitely-unsent retry beyond message expiry", async () => {
    const { port, completion } = fixture({
      load: { ...opened, intent: { ...intent, expiresAt: "2026-10-29T02:00:30.000Z" } },
      result: { kind: "DEFINITELY_UNSENT_RETRYABLE" },
    });
    // The fake send is permitted to see only the original sample, so match
    // the updated expiry-bearing intent just for this provider adapter.
    port.send = async () => ({ kind: "DEFINITELY_UNSENT_RETRYABLE" });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("FAILED_UNSENT");
    expect(completion).toEqual([{
      messageId: claim.messageId, worker: "worker-01", fence: 3,
      outcome: "FAILED", safeFailureCode: "RETRY_WINDOW_EXPIRED",
    }]);
  });

  it("preserves a retry when expiry is strictly after its next due instant", async () => {
    const { port, completion } = fixture({
      load: { ...opened, intent: { ...intent, expiresAt: "2026-10-29T02:01:01.000Z" } },
      result: { kind: "DEFINITELY_UNSENT_RETRYABLE" },
    });
    port.send = async () => ({ kind: "DEFINITELY_UNSENT_RETRYABLE" });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RETRY_SCHEDULED");
    expect(completion).toEqual([{
      messageId: claim.messageId, worker: "worker-01", fence: 3,
      outcome: "RETRY", safeFailureCode: "CONFIRMED_NOT_SENT",
      nextAttemptAt: new Date("2026-10-29T02:01:00.000Z"),
    }]);
  });

  it("never schedules a retry at the exact expiry boundary", async () => {
    const { port, completion } = fixture({
      load: { ...opened, intent: { ...intent, expiresAt: "2026-10-29T02:01:00.000Z" } },
      result: { kind: "DEFINITELY_UNSENT_RETRYABLE" },
    });
    port.send = async () => ({ kind: "DEFINITELY_UNSENT_RETRYABLE" });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("FAILED_UNSENT");
    expect(completion[0]).toMatchObject({ outcome: "FAILED",
      safeFailureCode: "RETRY_WINDOW_EXPIRED" });
  });

  it("fails definitely-unsent attempts at the fifth try, never schedules a sixth", async () => {
    const { port, completion } = fixture({
      load: { ...opened, attempts: 5 },
      result: { kind: "DEFINITELY_UNSENT_RETRYABLE" },
    });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("FAILED_UNSENT");
    expect(completion).toEqual([{
      messageId: claim.messageId, worker: "worker-01", fence: 3,
      outcome: "FAILED", safeFailureCode: "CONFIRMED_NOT_SENT",
    }]);
  });

  it("refuses EMAIL delivery when the global suppression identity is absent", async () => {
    const { port, calls } = fixture({ load: { ...opened, globalEmailHash: null } });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(calls).toEqual(["load"]);
  });

  it("refuses SMS delivery if an EMAIL global hash was attached", async () => {
    const { port, calls } = fixture({
      load: { ...opened, intent: { ...intent, channel: "SMS", recipient: "+919000000000" } },
    });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(calls).toEqual(["load"]);
  });

  it("does not mistake a failed DB completion after provider acceptance for success", async () => {
    const { port, calls } = fixture({ completeOk: false });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(calls).toEqual(["load", "authorize", "send", "complete"]);
  });

  it("never delivers after failed decryption/load or malformed provider acceptance", async () => {
    const bad = fixture({ loadThrows: true });
    expect(await executeClaimedOutbound(claim, "worker-01", bad.port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(bad.calls).toEqual(["load"]);
    const invalid = fixture({ result: { kind: "ACCEPTED", providerMessageId: "PII raw content with spaces" } });
    expect(await executeClaimedOutbound(claim, "worker-01", invalid.port))
      .toBe("RECONCILIATION_REQUIRED");
    expect(invalid.calls).toEqual(["load", "authorize", "send"]);
  });

  it("does not retry a known permanently unsent provider rejection", async () => {
    const { port, completion } = fixture({
      result: { kind: "DEFINITELY_UNSENT_PERMANENT" },
    });
    expect(await executeClaimedOutbound(claim, "worker-01", port))
      .toBe("FAILED_UNSENT");
    expect(completion[0]).toMatchObject({
      outcome: "FAILED", safeFailureCode: "CONFIRMED_NOT_SENT",
    });
  });
});
