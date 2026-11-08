import { timingSafeEqual } from "node:crypto";
import type { ZodType } from "zod";

/**
 * Central pipeline for machine-to-machine routes (docs/security/central-security-architecture.md, layer L10).
 *
 * Order, fail-closed: browser Origin rejected -> query string rejected (unless allowed) -> machine credential
 * (constant-time, at least 32 bytes, from one named environment variable) -> bounded body -> handler.
 * Every response is `Cache-Control: no-store` and carries a request id. A missing or short server secret
 * denies every call; the denial never says which check failed.
 */

export type InternalDeps = {
  /** Reads a deployment secret by name (injected so tests never touch process.env). */
  readSecret: (name: string) => string | undefined;
  /** True only when the request carries no body at all (stream-checked, not Content-Length). */
  readEmpty?: (request: Request) => Promise<boolean>;
  readJson: (request: Request, maxBytes: number) => Promise<
    { kind: "OK"; value: unknown } | { kind: "INVALID" } | { kind: "TOO_LARGE" }
  >;
  onError: (error: unknown) => Response;
  newRequestId: () => string;
  /** Runs the handler inside a named system tenant scope (jobs have no actor). */
  runInSystemScope?: <T>(reason: string, fn: () => T) => T;
  /** Called on every denial with a reason code. Never receives the credential. */
  onDenied?: (event: { route: string; reason: DenyReason; requestId: string }) => void;
  /**
   * Replay protection (SEC-16-010). When this returns true every call must carry a fresh `x-lms-timestamp`
   * (epoch seconds, within 5 minutes) and a one-time `x-lms-nonce`; a nonce is accepted once per route.
   * Checked only AFTER the credential matched, so an unauthenticated caller cannot burn nonces.
   */
  replayRequired?: () => boolean;
  /** True the first time this key is seen (fails closed by throwing when the shared store is unreachable). */
  claimNonce?: (key: string, ttlSeconds: number) => Promise<boolean>;
  now?: () => number;
};

export type DenyReason = "ORIGIN" | "QUERY" | "CREDENTIAL" | "BODY" | "TIMESTAMP" | "REPLAY";

export const REPLAY_WINDOW_SECONDS = 300;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export type InternalCredential =
  | { kind: "header"; header: string; secretEnv: string }
  | { kind: "bearer"; secretEnv: string };

export type InternalRouteConfig<B> = {
  /** Stable name used in denial events, e.g. "internal.alerts.tick". */
  name: string;
  credential: InternalCredential;
  /** Allow a query string (default: rejected, no client selects job parameters). */
  allowQuery?: boolean;
  body?: { schema: ZodType<B>; maxBytes: number };
  /** The request must have no body (scheduler pings). Mutually exclusive with `body`. */
  emptyBody?: true;
  /** Keep a route's existing denial body so callers and tests see no change. */
  denied?: { status: number; body: unknown };
  /** Body for 400/413 responses (default { error: "INVALID_REQUEST" }). */
  invalid?: unknown;
};

const MIN_SECRET_BYTES = 32;
const MAX_SECRET_BYTES = 256;

export function credentialMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const bytes = Buffer.byteLength(expected, "utf8");
  // A short, oversized, padded or whitespace-containing server secret is a misconfiguration, never a pass.
  if (bytes < MIN_SECRET_BYTES || bytes > MAX_SECRET_BYTES || expected !== expected.trim() || /\s/u.test(expected)) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function withHeaders(response: Response, requestId: string) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  if (!headers.has("x-request-id")) headers.set("x-request-id", requestId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function createInternalRoute(deps: InternalDeps) {
  return function internalRoute<B = undefined>(
    config: InternalRouteConfig<B>,
    handler: (args: { request: Request; body: B; requestId: string }) => Promise<Response> | Response,
  ) {
    const denied = config.denied ?? { status: 403, body: { error: "FORBIDDEN" } };
    const invalid = config.invalid ?? { error: "INVALID_REQUEST" };
    if (config.emptyBody && config.body) throw new Error("emptyBody and body are mutually exclusive.");

    return async function handle(request: Request): Promise<Response> {
      const requestId = deps.newRequestId();
      const deny = (reason: DenyReason, status = denied.status, body: unknown = denied.body) => {
        deps.onDenied?.({ route: config.name, reason, requestId });
        return withHeaders(Response.json(body, { status }), requestId);
      };
      try {
        if (request.headers.has("origin")) return deny("ORIGIN");

        const cred = config.credential;
        const provided =
          cred.kind === "header"
            ? request.headers.get(cred.header)
            : (() => {
                const auth = request.headers.get("authorization");
                return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
              })();
        if (!credentialMatches(provided, deps.readSecret(cred.secretEnv))) return deny("CREDENTIAL");
        if (deps.replayRequired?.()) {
          const stamp = request.headers.get("x-lms-timestamp");
          const nonce = request.headers.get("x-lms-nonce");
          const seconds = stamp && /^[0-9]{9,11}$/.test(stamp) ? Number(stamp) : NaN;
          const nowSeconds = Math.floor((deps.now ? deps.now() : Date.now()) / 1000);
          if (!Number.isFinite(seconds) || Math.abs(nowSeconds - seconds) > REPLAY_WINDOW_SECONDS || !nonce || !NONCE_PATTERN.test(nonce)) {
            return deny("TIMESTAMP");
          }
          if (!deps.claimNonce) throw new Error("replayRequired needs deps.claimNonce.");
          // Twice the window, so a nonce outlives the timestamps that could still be accepted with it.
          if (!(await deps.claimNonce("internal:" + config.name + ":" + nonce, REPLAY_WINDOW_SECONDS * 2))) return deny("REPLAY");
        }
        // Validation errors are only revealed to an authenticated machine caller.
        if (!config.allowQuery && new URL(request.url).search) return deny("QUERY", 400, invalid);
        if (config.emptyBody) {
          if (!deps.readEmpty) throw new Error("emptyBody requires deps.readEmpty.");
          if (!(await deps.readEmpty(request))) return deny("BODY", 400, invalid);
        }

        let body = undefined as B;
        if (config.body) {
          const read = await deps.readJson(request, config.body.maxBytes);
          if (read.kind === "TOO_LARGE") return deny("BODY", 413, invalid);
          if (read.kind !== "OK") return deny("BODY", 400, invalid);
          body = config.body.schema.parse(read.value);
        }
        const run = () => handler({ request, body, requestId });
        return withHeaders(await (deps.runInSystemScope ? deps.runInSystemScope("internal:" + config.name, run) : run()), requestId);
      } catch (error) {
        return withHeaders(deps.onError(error), requestId);
      }
    };
  };
}
