/**
 * Shared outbound delivery state machine. This does NOT send to a provider.
 * Provider acceptance must never be described as recipient delivery.
 * Permanent bounces/complaints create a durable suppression before retries.
 */
export type OutboundStatus =
  | "PENDING"
  | "CLAIMED"
  | "RETRY"
  | "PROVIDER_ACCEPTED"
  | "DELIVERED"
  | "SUPPRESSED"
  | "BOUNCED"
  | "FAILED"
  | "EXPIRED";

export type OutboundProviderOutcome =
  | { kind: "ACCEPTED"; providerMessageId: string }
  | { kind: "DELIVERED"; providerMessageId: string }
  | { kind: "RETRYABLE_FAILURE" }
  | { kind: "PERMANENT_FAILURE" }
  | { kind: "HARD_BOUNCE" }
  | { kind: "COMPLAINT" };

const TERMINAL = new Set<OutboundStatus>([
  "PROVIDER_ACCEPTED", "DELIVERED", "SUPPRESSED",
  "BOUNCED", "FAILED", "EXPIRED",
]);

export type DispatchEligibility = {
  status: OutboundStatus;
  attempts: number;
  now: Date;
  notBefore: Date | null;
  nextAttemptAt: Date | null;
  expiresAt: Date | null;
  suppressed: boolean;
};

export type DispatchDecision =
  | { canDispatch: true }
  | { canDispatch: false; reason:
      "TERMINAL" | "ALREADY_CLAIMED" | "SUPPRESSED" |
      "MAX_ATTEMPTS" | "NOT_DUE" | "EXPIRED" | "INVALID_INPUT" };

export const MAX_OUTBOUND_ATTEMPTS = 5;

function validDate(date: Date | null) {
  return date === null ||
    (date instanceof Date && Number.isFinite(date.getTime()));
}

export function evaluateOutboundDispatch(input: DispatchEligibility): DispatchDecision {
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime()) ||
      !Number.isSafeInteger(input.attempts) || input.attempts < 0 ||
      !validDate(input.notBefore) || !validDate(input.nextAttemptAt) ||
      !validDate(input.expiresAt)) {
    return { canDispatch: false, reason: "INVALID_INPUT" };
  }
  if (TERMINAL.has(input.status)) {
    return { canDispatch: false, reason: "TERMINAL" };
  }
  if (input.status === "CLAIMED") {
    return { canDispatch: false, reason: "ALREADY_CLAIMED" };
  }
  if (input.suppressed) {
    return { canDispatch: false, reason: "SUPPRESSED" };
  }
  if (input.expiresAt && input.now >= input.expiresAt) {
    return { canDispatch: false, reason: "EXPIRED" };
  }
  if (input.attempts >= MAX_OUTBOUND_ATTEMPTS) {
    return { canDispatch: false, reason: "MAX_ATTEMPTS" };
  }
  if ((input.notBefore && input.now < input.notBefore) ||
      (input.nextAttemptAt && input.now < input.nextAttemptAt)) {
    return { canDispatch: false, reason: "NOT_DUE" };
  }
  if (input.status !== "PENDING" && input.status !== "RETRY") {
    return { canDispatch: false, reason: "INVALID_INPUT" };
  }
  return { canDispatch: true };
}

export function outboundRetryDelayMs(completedAttempts: number) {
  if (!Number.isSafeInteger(completedAttempts) ||
      completedAttempts < 1 || completedAttempts >= MAX_OUTBOUND_ATTEMPTS) {
    throw new Error("INVALID_OUTBOUND_ATTEMPTS");
  }
  // Jitter can be applied by the durable sender, but no retry exceeds 1h.
  return Math.min(3_600_000, 60_000 * (2 ** (completedAttempts - 1)));
}

export type OutboundOutcomeTransition = {
  status: OutboundStatus;
  providerMessageId: string | null;
  nextAttemptAt: Date | null;
  /** Persist this before another delivery is claimed. */
  suppression: "BOUNCE" | "COMPLAINT" | null;
};

export function planOutboundOutcome(input: {
  outcome: OutboundProviderOutcome;
  completedAttempts: number;
  now: Date;
}): OutboundOutcomeTransition {
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime()) ||
      !Number.isSafeInteger(input.completedAttempts) ||
      input.completedAttempts < 1 ||
      input.completedAttempts > MAX_OUTBOUND_ATTEMPTS) {
    throw new Error("INVALID_OUTBOUND_OUTCOME");
  }
  const outcome = input.outcome;
  if (outcome.kind === "ACCEPTED" || outcome.kind === "DELIVERED") {
    // Save only an opaque external ID. Never echo provider text to app users.
    if (!/^[A-Za-z0-9._:-]{1,200}$/.test(outcome.providerMessageId)) {
      throw new Error("INVALID_PROVIDER_MESSAGE_ID");
    }
    return {
      status: outcome.kind === "ACCEPTED" ? "PROVIDER_ACCEPTED" : "DELIVERED",
      providerMessageId: outcome.providerMessageId,
      nextAttemptAt: null, suppression: null,
    };
  }
  if (outcome.kind === "HARD_BOUNCE" || outcome.kind === "COMPLAINT") {
    return {
      status: outcome.kind === "HARD_BOUNCE" ? "BOUNCED" : "SUPPRESSED",
      providerMessageId: null, nextAttemptAt: null,
      suppression: outcome.kind === "HARD_BOUNCE" ? "BOUNCE" : "COMPLAINT",
    };
  }
  if (outcome.kind === "PERMANENT_FAILURE" ||
      input.completedAttempts >= MAX_OUTBOUND_ATTEMPTS) {
    return {
      status: "FAILED", providerMessageId: null,
      nextAttemptAt: null, suppression: null,
    };
  }
  return {
    status: "RETRY", providerMessageId: null, suppression: null,
    nextAttemptAt: new Date(input.now.getTime() +
      outboundRetryDelayMs(input.completedAttempts)),
  };
}
