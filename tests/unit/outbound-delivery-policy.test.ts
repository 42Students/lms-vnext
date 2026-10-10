import { describe, expect, it } from "vitest";
import {
  MAX_OUTBOUND_ATTEMPTS,
  evaluateOutboundDispatch,
  outboundRetryDelayMs,
  planOutboundOutcome,
  type DispatchEligibility,
} from "@/modules/operations/outbound-delivery-policy";

const now = new Date("2026-10-10T10:00:00.000Z");
const base: DispatchEligibility = {
  status: "PENDING", attempts: 0, now, notBefore: null,
  nextAttemptAt: null, expiresAt: null, suppressed: false,
};

describe("W06 outbound transport decisions, no false delivery claims", () => {
  it("permits only eligible due, unsuppressed, unclaimed, unexpired jobs", () => {
    expect(evaluateOutboundDispatch(base)).toEqual({ canDispatch: true });
    expect(evaluateOutboundDispatch({ ...base, suppressed: true })).toEqual({
      canDispatch: false, reason: "SUPPRESSED",
    });
    expect(evaluateOutboundDispatch({ ...base, status: "CLAIMED" }))
      .toMatchObject({ canDispatch: false, reason: "ALREADY_CLAIMED" });
    expect(evaluateOutboundDispatch({
      ...base, status: "PROVIDER_ACCEPTED",
    })).toMatchObject({ canDispatch: false, reason: "TERMINAL" });
    expect(evaluateOutboundDispatch({
      ...base, attempts: MAX_OUTBOUND_ATTEMPTS,
    })).toMatchObject({ canDispatch: false, reason: "MAX_ATTEMPTS" });
    expect(evaluateOutboundDispatch({
      ...base, notBefore: new Date(now.getTime() + 100),
    })).toMatchObject({ canDispatch: false, reason: "NOT_DUE" });
    expect(evaluateOutboundDispatch({
      ...base, expiresAt: now,
    })).toMatchObject({ canDispatch: false, reason: "EXPIRED" });
  });

  it("distinguishes provider acceptance, actual delivery and hard bounce", () => {
    expect(planOutboundOutcome({
      outcome: { kind: "ACCEPTED", providerMessageId: "provider-123" },
      completedAttempts: 1, now,
    }).status).toBe("PROVIDER_ACCEPTED");
    expect(planOutboundOutcome({
      outcome: { kind: "DELIVERED", providerMessageId: "provider-123" },
      completedAttempts: 1, now,
    }).status).toBe("DELIVERED");
    expect(planOutboundOutcome({
      outcome: { kind: "HARD_BOUNCE" },
      completedAttempts: 1, now,
    })).toMatchObject({ status: "BOUNCED", suppression: "BOUNCE" });
    expect(planOutboundOutcome({
      outcome: { kind: "COMPLAINT" },
      completedAttempts: 1, now,
    })).toMatchObject({ status: "SUPPRESSED", suppression: "COMPLAINT" });
  });

  it("schedules bounded retry without treating transient error as a send", () => {
    expect(outboundRetryDelayMs(1)).toBe(60_000);
    expect(outboundRetryDelayMs(2)).toBe(120_000);
    expect(outboundRetryDelayMs(4)).toBe(480_000);
    expect(planOutboundOutcome({
      outcome: { kind: "RETRYABLE_FAILURE" }, completedAttempts: 1, now,
    })).toMatchObject({
      status: "RETRY",
      nextAttemptAt: new Date(now.getTime() + 60_000),
    });
    expect(planOutboundOutcome({
      outcome: { kind: "RETRYABLE_FAILURE" },
      completedAttempts: MAX_OUTBOUND_ATTEMPTS, now,
    }).status).toBe("FAILED");
    expect(() => planOutboundOutcome({
      outcome: { kind: "ACCEPTED", providerMessageId: "token@example.com" },
      completedAttempts: 1, now,
    })).toThrow("INVALID_PROVIDER_MESSAGE_ID");
  });
});
