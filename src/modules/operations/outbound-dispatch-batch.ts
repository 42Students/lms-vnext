import type {
  OutboundClaim,
  OutboundClaimResult,
} from "./outbound-dispatch-orchestration";

/**
 * A bounded, provider-neutral worker loop.
 *
 * Claim exactly ONE record per iteration; never hold a batch of leases while
 * awaiting network I/O for earlier messages. A failed/uncertain dispatch
 * stops the loop so an operator can reconcile before the worker continues.
 * This function does not grant permissions, call providers, or turn an
 * ambiguous delivery into a retry.
 */
export type OutboundBatchPort = {
  claimOne: (worker: string) => Promise<OutboundClaim[]>;
  processOne: (claim: OutboundClaim, worker: string) =>
    Promise<OutboundClaimResult>;
};

export type OutboundBatchResult = {
  claimed: number;
  providerAccepted: number;
  retryScheduled: number;
  failedUnsent: number;
  suppressedOrDenied: number;
  requiresReconciliation: boolean;
};

const WORKER = /^[A-Za-z0-9_.:-]{1,120}$/;

export async function drainOutboundBatch(
  worker: string,
  maxMessages: number,
  port: OutboundBatchPort,
): Promise<OutboundBatchResult> {
  if (!WORKER.test(worker) || !Number.isSafeInteger(maxMessages) ||
      maxMessages < 1 || maxMessages > 20) {
    throw new Error("INVALID_OUTBOUND_BATCH");
  }

  const summary: OutboundBatchResult = {
    claimed: 0,
    providerAccepted: 0,
    retryScheduled: 0,
    failedUnsent: 0,
    suppressedOrDenied: 0,
    requiresReconciliation: false,
  };

  for (let index = 0; index < maxMessages; index++) {
    let claims: OutboundClaim[];
    try {
      claims = await port.claimOne(worker);
    } catch {
      // A failed claim request can be ambiguous; never re-claim blindly.
      summary.requiresReconciliation = true;
      break;
    }
    if (!Array.isArray(claims) || claims.length > 1) {
      // The source must only return zero or one lease. If it violates this,
      // another claimed row may exist and needs manual reconciliation.
      summary.requiresReconciliation = true;
      break;
    }
    if (claims.length === 0) break;
    const claim = claims[0];
    if (!claim) {
      summary.requiresReconciliation = true;
      break;
    }
    summary.claimed++;

    let outcome: OutboundClaimResult;
    try {
      outcome = await port.processOne(claim, worker);
    } catch {
      summary.requiresReconciliation = true;
      break;
    }

    switch (outcome) {
      case "PROVIDER_ACCEPTED":
        summary.providerAccepted++;
        break;
      case "RETRY_SCHEDULED":
        summary.retryScheduled++;
        break;
      case "FAILED_UNSENT":
        summary.failedUnsent++;
        break;
      case "NOT_AUTHORIZED":
        summary.suppressedOrDenied++;
        break;
      case "RECONCILIATION_REQUIRED":
      default:
        summary.requiresReconciliation = true;
        break;
    }
    if (summary.requiresReconciliation) break;
  }

  return summary;
}
