import type { OutboundDeliveryIntent } from "./outbound-delivery-contract";
import {
  MAX_OUTBOUND_ATTEMPTS,
  outboundRetryDelayMs,
} from "./outbound-delivery-policy";

/**
 * A transport-independent, fail-closed step for one previously leased row.
 * This function does not acquire claims or own a provider transport. Only a
 * trusted worker may supply the ports; never pass arbitrary HTTP request data
 * or an unverified provider callback into this boundary.
 *
 * A timeout, thrown provider error or ambiguous acceptance MUST leave the
 * CLAIMED row quarantined for reconciliation. Do not requeue it automatically.
 */
export type OutboundClaim = {
  messageId: string;
  fence: number;
  requestDigest: string;
};

export type OpenedOutboundClaim = {
  intent: OutboundDeliveryIntent;
  attempts: number;
  /** Derived from the decrypted EMAIL recipient with the dedicated secret. */
  globalEmailHash: string | null;
};

export type TrustedProviderResult =
  | { kind: "ACCEPTED"; providerMessageId: string }
  | { kind: "DEFINITELY_UNSENT_RETRYABLE" }
  | { kind: "DEFINITELY_UNSENT_PERMANENT" }
  | { kind: "UNKNOWN" };

export type OutboundClaimCompletion = {
  messageId: string;
  worker: string;
  fence: number;
  outcome: "PROVIDER_ACCEPTED" | "RETRY" | "FAILED";
  providerMessageId?: string;
  safeFailureCode?: string;
  nextAttemptAt?: Date;
};

export type OutboundDispatchPort = {
  /** Must verify the exact live worker/fence and encrypted request digest. */
  load: (claim: OutboundClaim, worker: string) =>
    Promise<OpenedOutboundClaim | null>;
  /** DB-owned same-fence pre-send guard, including late global/local opt-outs. */
  authorize: (input: {
    messageId: string;
    worker: string;
    fence: number;
    globalEmailHash: string | null;
  }) => Promise<boolean>;
  /** Trusted adapter must distinguish confirmed unsent from uncertain. */
  send: (intent: OutboundDeliveryIntent) => Promise<TrustedProviderResult>;
  complete: (input: OutboundClaimCompletion) => Promise<boolean>;
  now: () => Date;
};

export type OutboundClaimResult =
  | "NOT_AUTHORIZED"
  | "PROVIDER_ACCEPTED"
  | "RETRY_SCHEDULED"
  | "FAILED_UNSENT"
  | "RECONCILIATION_REQUIRED";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digestPattern = /^[0-9a-f]{64}$/;
const providerIdPattern = /^[A-Za-z0-9._:-]{1,200}$/;

/** A generic provider error must never be converted into a retryable send. */
export async function executeClaimedOutbound(
  claim: OutboundClaim,
  worker: string,
  port: OutboundDispatchPort,
): Promise<OutboundClaimResult> {
  if (!idPattern.test(claim.messageId) ||
      !Number.isSafeInteger(claim.fence) || claim.fence < 1 ||
      !digestPattern.test(claim.requestDigest) ||
      !/^[A-Za-z0-9_.:-]{1,120}$/.test(worker)) {
    return "RECONCILIATION_REQUIRED";
  }

  let opened: OpenedOutboundClaim | null;
  try {
    opened = await port.load(claim, worker);
  } catch {
    return "RECONCILIATION_REQUIRED";
  }
  if (!opened ||
      !Number.isSafeInteger(opened.attempts) ||
      opened.attempts < 1 || opened.attempts > MAX_OUTBOUND_ATTEMPTS ||
      (opened.intent.channel === "EMAIL" &&
        !digestPattern.test(opened.globalEmailHash ?? "")) ||
      (opened.intent.channel !== "EMAIL" && opened.globalEmailHash !== null)) {
    return "RECONCILIATION_REQUIRED";
  }

  // An application-only check is insufficient: this must call the SQL
  // exact-claim pre-send fence and evaluate late suppression at send time.
  let authorized = false;
  try {
    authorized = await port.authorize({
      messageId: claim.messageId,
      worker,
      fence: claim.fence,
      globalEmailHash: opened.globalEmailHash,
    });
  } catch {
    return "RECONCILIATION_REQUIRED";
  }
  if (!authorized) return "NOT_AUTHORIZED";

  let response: TrustedProviderResult;
  try {
    response = await port.send(opened.intent);
  } catch {
    // The transport may have accepted the request before the exception.
    return "RECONCILIATION_REQUIRED";
  }
  if (response.kind === "UNKNOWN") return "RECONCILIATION_REQUIRED";

  let completion: OutboundClaimCompletion;
  let successfulResult: OutboundClaimResult;
  if (response.kind === "ACCEPTED") {
    if (!providerIdPattern.test(response.providerMessageId)) {
      return "RECONCILIATION_REQUIRED";
    }
    completion = {
      messageId: claim.messageId, worker, fence: claim.fence,
      outcome: "PROVIDER_ACCEPTED", providerMessageId: response.providerMessageId,
    };
    successfulResult = "PROVIDER_ACCEPTED";
  } else if (response.kind === "DEFINITELY_UNSENT_PERMANENT" ||
             opened.attempts >= MAX_OUTBOUND_ATTEMPTS) {
    completion = {
      messageId: claim.messageId, worker, fence: claim.fence,
      outcome: "FAILED", safeFailureCode: "CONFIRMED_NOT_SENT",
    };
    successfulResult = "FAILED_UNSENT";
  } else if (response.kind === "DEFINITELY_UNSENT_RETRYABLE") {
    const now = port.now();
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      return "RECONCILIATION_REQUIRED";
    }
    completion = {
      messageId: claim.messageId, worker, fence: claim.fence,
      outcome: "RETRY", safeFailureCode: "CONFIRMED_NOT_SENT",
      nextAttemptAt: new Date(now.getTime() +
        outboundRetryDelayMs(opened.attempts)),
    };
    successfulResult = "RETRY_SCHEDULED";
  } else {
    return "RECONCILIATION_REQUIRED";
  }

  try {
    return (await port.complete(completion))
      ? successfulResult : "RECONCILIATION_REQUIRED";
  } catch {
    // An accepted external call cannot be unwound by a failed DB write.
    return "RECONCILIATION_REQUIRED";
  }
}
