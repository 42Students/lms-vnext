import { describe, expect, it } from "vitest";
import {
  validOutboundCompletion,
  type OutboundCompletionInput,
} from "@/modules/operations/outbound-dispatch-completion";

const base: OutboundCompletionInput = {
  messageId: "10000000-0000-4000-8000-000000000001",
  worker: "worker:01",
  fence: 4,
  outcome: "PROVIDER_ACCEPTED",
  providerMessageId: "zeptomail:message_0001",
};

describe("DB-067 outbound privileged completion input validation", () => {
  it("accepts only well-formed provider acceptance, confirmed-unsent retry and failure", () => {
    expect(validOutboundCompletion(base)).toBe(true);
    expect(validOutboundCompletion({
      ...base, outcome: "RETRY", providerMessageId: null,
      safeFailureCode: "CONFIRMED_NOT_SENT",
      nextAttemptAt: new Date("2030-01-01T00:00:00Z"),
    })).toBe(true);
    expect(validOutboundCompletion({
      ...base, outcome: "FAILED", providerMessageId: null,
      safeFailureCode: "CONFIRMED_NOT_SENT",
    })).toBe(true);
  });

  it("rejects arbitrary provider payload and missing provider identifiers", () => {
    for (const providerMessageId of [
      null, "", "user@example.test", "contains whitespace",
      "token=secret", "raw\nresponse", "a".repeat(201),
    ]) {
      expect(validOutboundCompletion({
        ...base, providerMessageId,
      })).toBe(false);
    }
  });

  it("rejects contradictory completion shapes, never guessing failure semantics", () => {
    const bad = [
      { ...base, safeFailureCode: "UNKNOWN" },
      { ...base, nextAttemptAt: new Date("2030-01-01T00:00:00Z") },
      { ...base, outcome: "RETRY" as const, providerMessageId: null },
      { ...base, outcome: "RETRY" as const, providerMessageId: null,
        safeFailureCode: "CONFIRMED_NOT_SENT" },
      { ...base, outcome: "FAILED" as const, providerMessageId: null,
        safeFailureCode: "CONFIRMED_NOT_SENT", nextAttemptAt: new Date() },
      { ...base, outcome: "RETRY" as const, providerMessageId: null,
        safeFailureCode: "provider said no", nextAttemptAt: new Date() },
    ];
    for (const value of bad) {
      expect(validOutboundCompletion(value)).toBe(false);
    }
  });

  it("does not accept a runtime-forged outcome, invalid UUID, stale fence or worker", () => {
    const mutations = [
      { ...base, outcome: "DELIVERED" },
      { ...base, messageId: "not-an-id" },
      { ...base, worker: "worker with whitespace" },
      { ...base, fence: 0 },
      { ...base, fence: Number.MAX_SAFE_INTEGER + 1 },
      { ...base, fence: -1 },
    ];
    for (const mutation of mutations) {
      expect(validOutboundCompletion(mutation as OutboundCompletionInput))
        .toBe(false);
    }
  });

  it("rejects invalid dates before they enter SQL or become queued retries", () => {
    for (const nextAttemptAt of [
      new Date(Number.NaN), "2030-01-01" as unknown as Date,
    ]) {
      expect(validOutboundCompletion({
        ...base, outcome: "RETRY", providerMessageId: null,
        safeFailureCode: "CONFIRMED_NOT_SENT", nextAttemptAt,
      })).toBe(false);
    }
  });
});
