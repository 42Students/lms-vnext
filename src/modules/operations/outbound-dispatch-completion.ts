/**
 * Validate the untrusted runtime shape of a sender's outcome before it is
 * passed to the privileged SQL completion routine. PostgreSQL still makes
 * the final live-lease, pre-send-fence and time/race decision.
 *
 * In particular, provider IDs must be opaque safe identifiers, NOT free-text
 * responses that may contain a recipient address, token or secret.
 */
export type OutboundCompletionInput = {
  messageId: string;
  worker: string;
  fence: number;
  outcome: "PROVIDER_ACCEPTED" | "RETRY" | "FAILED";
  providerMessageId?: string | null;
  safeFailureCode?: string | null;
  nextAttemptAt?: Date | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WORKER = /^[A-Za-z0-9_.:-]{1,120}$/;
const PROVIDER_ID = /^[A-Za-z0-9._:-]{1,200}$/;
const FAILURE_CODE = /^[A-Z0-9_]{1,40}$/;

export function validOutboundCompletion(input: OutboundCompletionInput): boolean {
  if (!input || !UUID.test(input.messageId) ||
      !WORKER.test(input.worker) ||
      !Number.isSafeInteger(input.fence) || input.fence < 1) {
    return false;
  }

  const providerId = input.providerMessageId ?? null;
  const failure = input.safeFailureCode ?? null;
  const next = input.nextAttemptAt ?? null;
  if (next !== null &&
      (!(next instanceof Date) || !Number.isFinite(next.getTime()))) {
    return false;
  }

  switch (input.outcome) {
    case "PROVIDER_ACCEPTED":
      return typeof providerId === "string" && PROVIDER_ID.test(providerId) &&
        failure === null && next === null;
    case "RETRY":
      return providerId === null &&
        typeof failure === "string" && FAILURE_CODE.test(failure) &&
        next !== null;
    case "FAILED":
      return providerId === null &&
        typeof failure === "string" && FAILURE_CODE.test(failure) &&
        next === null;
    default:
      return false;
  }
}
