import { describe, expect, it, vi } from "vitest";
import {
  drainOutboundBatch,
  type OutboundBatchPort,
} from "@/modules/operations/outbound-dispatch-batch";
import type { OutboundClaim } from "@/modules/operations/outbound-dispatch-orchestration";

const claim: OutboundClaim = {
  messageId: "10000000-0000-4000-8000-000000000001",
  fence: 1,
  requestDigest: "a".repeat(64),
};

describe("DB-067 one-lease outbound dispatch batching", () => {
  it("claims one record at a time, only after previous completion", async () => {
    const calls: string[] = [];
    let claimed = 0;
    const port: OutboundBatchPort = {
      claimOne: async () => {
        calls.push("claim");
        claimed++;
        return claimed <= 2 ? [{ ...claim, fence: claimed }] : [];
      },
      processOne: async (value) => {
        calls.push("process-" + value.fence);
        return "PROVIDER_ACCEPTED";
      },
    };
    expect(await drainOutboundBatch("worker-1", 10, port)).toEqual({
      claimed: 2, providerAccepted: 2, retryScheduled: 0,
      failedUnsent: 0, suppressedOrDenied: 0,
      requiresReconciliation: false,
    });
    expect(calls).toEqual([
      "claim", "process-1", "claim", "process-2", "claim",
    ]);
  });

  it("stops immediately after an ambiguous provider result, never retries", async () => {
    const claimOne = vi.fn(async () => [claim]);
    const processOne = vi.fn(async () => "RECONCILIATION_REQUIRED" as const);
    const outcome = await drainOutboundBatch("worker-1", 20, {
      claimOne, processOne,
    });
    expect(outcome.claimed).toBe(1);
    expect(outcome.requiresReconciliation).toBe(true);
    expect(claimOne).toHaveBeenCalledTimes(1);
    expect(processOne).toHaveBeenCalledTimes(1);
  });

  it("treats thrown transport errors as unknown, not as a retry", async () => {
    const claimed = vi.fn(async () => [claim]);
    const sent = vi.fn(async () => {
      throw new Error("private provider timeout");
    });
    const result = await drainOutboundBatch("worker-1", 20, {
      claimOne: claimed, processOne: sent,
    });
    expect(result.requiresReconciliation).toBe(true);
    expect(result.retryScheduled).toBe(0);
    expect(claimed).toHaveBeenCalledTimes(1);
    expect(sent).toHaveBeenCalledTimes(1);
  });

  it("does not proceed if a claim port unexpectedly returns several leases", async () => {
    const processOne = vi.fn();
    const result = await drainOutboundBatch("worker-1", 5, {
      claimOne: async () => [claim, { ...claim, fence: 2 }],
      processOne,
    });
    expect(result.requiresReconciliation).toBe(true);
    expect(result.claimed).toBe(0);
    expect(processOne).not.toHaveBeenCalled();
  });

  it("counts definitely-unsent retry, denial and failure without reporting delivery", async () => {
    let n = 0;
    const outcomes = ["RETRY_SCHEDULED", "NOT_AUTHORIZED", "FAILED_UNSENT"] as const;
    const result = await drainOutboundBatch("worker-1", 10, {
      claimOne: async () => n < 3 ? [{ ...claim, fence: n + 1 }] : [],
      processOne: async () => outcomes[n++]!,
    });
    expect(result).toEqual({
      claimed: 3, providerAccepted: 0, retryScheduled: 1,
      failedUnsent: 1, suppressedOrDenied: 1,
      requiresReconciliation: false,
    });
  });

  it("fails closed on invalid worker names or unbounded batch sizes", async () => {
    const port: OutboundBatchPort = {
      claimOne: vi.fn(), processOne: vi.fn(),
    };
    for (const [worker, maximum] of [
      ["invalid worker", 2], ["worker", 0],
      ["worker", 21], ["worker", Number.NaN],
    ] as const) {
      await expect(drainOutboundBatch(worker, maximum, port))
        .rejects.toThrow("INVALID_OUTBOUND_BATCH");
    }
    expect(port.claimOne).not.toHaveBeenCalled();
  });
});
