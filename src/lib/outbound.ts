/**
 * GR-50: bounded resilient server-side provider requests (Exotel/ZeptoMail/R2).
 * Usage: await outboundFetch(url, { method: "POST", idempotencyKey, body });
 * Non-idempotent POST is attempted once unless an idempotency key is supplied.
 * Caller must verify that the provider honors its idempotency header before
 * enabling unsafe-operation retries. Exhausted HTTP statuses are logged without
 * provider body, URLs, recipient data or credential disclosure.
 * Provider text is never exposed to callers through the thrown error.
 */
import { friendlyApiError } from "@/lib/friendly-error";
import { createRequestId } from "@/lib/request-id";
import { logError, logInfo } from "@/observability/logger";

export type OutboundOptions = RequestInit & {
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  idempotencyKey?: string;
  /** Injectable transport keeps provider tests isolated from real networks. */
  fetchImpl?: typeof fetch;
};

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

export class OutboundUnavailableError extends Error {
  constructor(public readonly requestId: string) {
    super(friendlyApiError({ status: 503 }));
    this.name = "OutboundUnavailableError";
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function outboundFetch(url: string, options: OutboundOptions = {}): Promise<Response> {
  const {
    timeoutMs = 10_000, maxAttempts = 3, baseDelayMs = 250,
    idempotencyKey, fetchImpl = fetch, ...init
  } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const repeatable = SAFE_METHODS.has(method) || Boolean(idempotencyKey);
  const attempts = repeatable ? Math.min(Math.max(1, maxAttempts), 5) : 1;
  const requestId = createRequestId();
  const headers = new Headers(init.headers);
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (init.signal?.aborted) controller.abort();
    else init.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
    try {
      const response = await fetchImpl(url, { ...init, headers, signal: controller.signal });
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === attempts) {
        if (RETRYABLE_STATUSES.has(response.status)) {
          // A provider may have accepted a timed-out or rejected POST. Report
          // uncertainty for outbox reconciliation; never retry without confirmed deduplication.
          logInfo("outbound.retry_deferred", {
            requestId, attempt, status: response.status,
            circuitBreaker: repeatable ? "bounded retries exhausted" :
              "unsafe provider operation; manual/outbox reconciliation required",
          });
        }
        return response;
      }
      // Discard the body before trying again so pooled connections are reusable.
      await response.body?.cancel();
      logInfo("outbound.retry", { requestId, attempt, status: response.status,
        circuitBreaker: "bounded retries; configure provider-specific breaker on persistent outage" });
    } catch (error: unknown) {
      if (init.signal?.aborted) throw new OutboundUnavailableError(requestId);
      if (attempt === attempts) {
        /** GR-50: never record raw provider exceptions (which may embed OTPs, credentials, or recipients). */
        logError("outbound.unavailable", new Error("Upstream request failed"), { requestId, attempt,
          circuitBreaker: "provider unavailable; repeated failures should open the provider circuit" });
        throw new OutboundUnavailableError(requestId);
      }
      logInfo("outbound.retry", { requestId, attempt, status: null,
        circuitBreaker: "bounded retries" });
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", abort);
    }
    const capped = Math.min(4_000, baseDelayMs * 2 ** (attempt - 1));
    await delay(capped + Math.floor(Math.random() * Math.max(1, capped / 4)));
  }
  throw new OutboundUnavailableError(requestId);
}
