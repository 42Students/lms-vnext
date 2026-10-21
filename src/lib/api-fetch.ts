import {publicNetworkNotice} from "@/modules/auth/public-network-notice-model";
/**
 * Guarded JSON fetch for client components. Usage:
 *   const data = await apiFetch<MyPayload>("/api/example", { method: "POST", body: ... });
 *   catch (reason) { setError(reason instanceof Error ? reason.message : friendlyApiError({})); }
 * All errors are safe to show. requestId/status/code are retained for support.
 */
import { friendlyApiError } from "@/lib/friendly-error";
import { isRequestId } from "@/lib/request-id";

export type ApiFetchOptions = RequestInit & { timeoutMs?: number };

export class FriendlyFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null = null,
    public readonly requestId: string | null = null,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "FriendlyFetchError";
  }
}

/** A caller-initiated abort is not a network failure and must not trigger retry UI. */
export class ApiFetchCancelledError extends FriendlyFetchError {
  readonly silent = true;
  readonly retryable = false;
  constructor() {
    super("", 499, "REQUEST_CANCELLED");
    this.name = "ApiFetchCancelledError";
  }
}
export function isApiFetchCancelled(error: unknown): error is ApiFetchCancelledError {
  return error instanceof ApiFetchCancelledError;
}

function errorBody(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function safeFields(input: unknown): Record<string, string> {
  const body = errorBody(input);
  const fields: Record<string, string> = {};
  for (const [field, value] of Object.entries(body)) {
    if (typeof value === "string" && /^[A-Za-z0-9_.\[\]-]{1,128}$/.test(field)) {
      // Form errors are server-authored safe summaries, not provider text.
      fields[field] = value;
    }
  }
  return fields;
}

/** GR-04: errors, malformed HTML, timeouts and network failures never leak details. */
export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init: ApiFetchOptions = {},
): Promise<T> {
  const { timeoutMs = 30_000, ...options } = init;
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", forwardAbort, { once: true });
  let didTimeout = false;
  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, Math.max(1, timeoutMs));

  try {
    const response = await fetch(input, { ...options, signal: controller.signal });
    const headerId = response.headers.get("x-request-id");
    if (response.ok && (response.status === 204 || response.status === 205)) return undefined as T;
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      // Proxy-generated HTML (including 502 pages) is never shown verbatim.
      throw new FriendlyFetchError(friendlyApiError({ status: 502 }), 502,
        null, isRequestId(headerId) ? headerId : null);
    }
    if (!response.ok) {
      const body = errorBody(payload);
      const code = typeof body.error === "string" ? body.error
        : typeof body.code === "string" ? body.code : null;
      const requestId = isRequestId(body.requestId) ? body.requestId
        : isRequestId(headerId) ? headerId : null;
      const rawRetry = typeof body.retryAfterSeconds === "number"
        ? body.retryAfterSeconds : Number(response.headers.get("Retry-After"));
      const retryAfterSeconds = Number.isInteger(rawRetry) && rawRetry >= 1 && rawRetry <= 3600
        ? rawRetry : null;
      throw new FriendlyFetchError(
        friendlyApiError({ status: response.status, code }), response.status,
        code, requestId, safeFields(body.fieldErrors), retryAfterSeconds,
      );
    }
    return payload as T;
  } catch (reason) {
    // Explicit user/route cancellation is a silent, non-retryable outcome.
    // This must run before the global network-warning dispatcher.
    if (!didTimeout && options.signal?.aborted) throw new ApiFetchCancelledError();
    const status=reason instanceof FriendlyFetchError?reason.status:didTimeout?504:0;
    if(typeof window!=="undefined"){
      const path=typeof input==="string"?input:input instanceof URL?input.pathname:input instanceof Request?input.url:"";
      const notice=publicNetworkNotice({status,isSessionChange:/\/api\/auth\/session(?:\?|$)/.test(path)});
      if(notice)window.dispatchEvent(new CustomEvent("lms:network-notice",{detail:notice}));
    }
    if (reason instanceof FriendlyFetchError) throw reason;
    if (didTimeout) {
      throw new FriendlyFetchError(friendlyApiError({ status: 504 }), 504);
    }
    throw new FriendlyFetchError(friendlyApiError({ network: true }), 0);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}
