import { hardenDownload, isDownload } from "@/security/download-core";

import { CACHE } from "@/security/responses";
/**
 * `secured()` wraps ANY route handler without reading or changing its body (docs/security/central-security-architecture.md).
 *
 * It is the universal chokepoint: every API route passes through it (CI guard), so a central rule is added here once.
 * It does only things that are safe for every handler shape:
 *   - request id (header `x-request-id`, never overwriting one the handler set),
 *   - opens the per-request database-scope holder that `getCurrentRequestContext()` fills in (row-level security),
 *   - optional central same-origin enforcement for state-changing requests (`csrf: "enforce"`),
 *   - one audit line for every state-changing request and every 401/403/429 outcome.
 * It never alters the response body, status or cookies, and a throwing audit hook never changes the outcome.
 * Routes that need permissions, schemas or bounded bodies move from `secured()` to the full `route()` wrapper.
 */

type Actor = { userId: string | null; collegeId: string | null; role: string | null };

export type SecuredDeps = {
  isSameOrigin: (request: Request) => boolean;
  runWithHolder: <T>(fn: () => T) => T;
  /** The actor identifiers bound for this request, if the handler authenticated. */
  currentActor: () => Actor | null;
  onAudit?: (event: {
    requestId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    actor: Actor | null;
    /** True when the response was a file download (an export), audited even for GET. */
    download?: boolean;
  }) => void;
  newRequestId: () => string;
  /** Resolves the authenticated actor (memoised per request so the handler's own lookup is free). */
  getContext?: () => Promise<unknown>;
  /** Throws when the actor lacks the permission. */
  requirePermission?: (context: never, permission: string) => void;
  /** Called with the resolved actor once its permission passed, so the handler's first lookup can reuse it. */
  onPermitted?: (context: unknown) => void;
  /** Throws when the actor's sign-in is older than maxAgeSeconds (step-up authentication). */
  requireFreshAuth?: (context: unknown, maxAgeSeconds: number) => Promise<void>;
  /**
   * Abuse control for every state-changing request, keyed without resolving the session (so no handler's own order
   * changes): returns false when the caller is over its budget. Absent = no limit.
   */
  allowRequest?: (key: string, limit: number, windowMs: number) => Promise<boolean>;
  /**
   * Budgets to draw on, checked in order and each charged only if the earlier ones passed (so a caller who rotates the
   * cookie value to get fresh buckets is stopped by the coarser address budget first). Empty = no limit.
   */
  rateBuckets?: (request: Request) => Array<{ key: string; limit: number }>;
  /** Window for every bucket (default one minute). */
  mutationWindowMs?: number;
  /** Maps a thrown session/authorization error to the platform's standard response. */
  onError?: (error: unknown) => Response;
};

export type SecuredOptions = {
  /** "enforce": reject a state-changing request whose Origin is not this host, before the handler runs. "own": the handler checks. */
  csrf?: "enforce" | "own";
  /**
   * A registered permission, checked centrally after the origin check and before the handler runs. Only for handlers
   * whose own order is (origin, then authentication), so the central check changes nothing a caller can see except
   * that a missing permission is refused before any work.
   */
  permission?: string;
  /**
   * Step-up authentication: the sign-in must be no older than 15 minutes (or `{ maxAgeSeconds }`). Checked after the
   * origin check and before the handler, like `permission`; sensitive actions only (role/permission changes, user
   * disable or delete, bulk export/import, secret/integration and tenant settings).
   */
  stepUp?: true | { maxAgeSeconds: number };
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

function stamp(response: unknown, requestId: string) {
  if (!(response instanceof Response)) return;
  try {
    if (!response.headers.has("x-request-id")) response.headers.set("x-request-id", requestId);
  } catch {
    /* immutable headers (e.g. a proxied fetch Response): leave it unchanged */
  }
}

export function createSecured(deps: SecuredDeps) {
  return function secured<F extends (...args: never[]) => unknown>(handler: F, options: SecuredOptions = {}): F {
    const wrapped = async (...args: unknown[]) => {
      // Handlers are sometimes invoked without a Request (direct calls, tests); treat that as a plain read.
      const first = args[0] as Request | undefined;
      const request = first && typeof first.method === "string" ? first : undefined;
      const method = request ? request.method.toUpperCase() : "GET";
      const mutating = !SAFE_METHODS.has(method);
      const requestId = deps.newRequestId();
      const started = Date.now();

      const audit = (status: number, download = false) => {
        if (!deps.onAudit) return;
        if (mutating || download || status === 401 || status === 403 || status === 429) {
          try {
            deps.onAudit({
              requestId,
              method,
              path: request ? safePath(request.url) : "",
              status,
              durationMs: Date.now() - started,
              actor: deps.currentActor(),
              ...(download ? { download: true } : {}),
            });
          } catch {
            /* auditing must never change the response */
          }
        }
      };

      return deps.runWithHolder(async () => {
        if (request && mutating && options.csrf === "enforce" && !deps.isSameOrigin(request)) {
          const denied = Response.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: { "x-request-id": requestId } });
          audit(403);
          return denied;
        }
        if (request && mutating && deps.allowRequest && deps.rateBuckets) {
          const windowMs = deps.mutationWindowMs ?? 60_000;
          let over = false;
          for (const bucket of deps.rateBuckets(request)) {
            if (!(await deps.allowRequest("w:" + bucket.key, bucket.limit, windowMs))) { over = true; break; }
          }
          if (over) {
            const limited = Response.json({ error: "RATE_LIMITED" }, {
              status: 429, headers: { "x-request-id": requestId, "Retry-After": String(Math.ceil(windowMs / 1000)), "Cache-Control": CACHE.NONE },
            });
            audit(429);
            return limited;
          }
        }
        if (options.permission || options.stepUp) {
          if (!deps.getContext || !deps.onError) throw new Error("permission and stepUp require getContext and onError.");
          if (options.permission && !deps.requirePermission) throw new Error("permission requires requirePermission.");
          if (options.stepUp && !deps.requireFreshAuth) throw new Error("stepUp requires requireFreshAuth.");
          try {
            const context = await deps.getContext();
            if (options.permission) deps.requirePermission!(context as never, options.permission);
            if (options.stepUp) await deps.requireFreshAuth!(context, options.stepUp === true ? 900 : options.stepUp.maxAgeSeconds);
            deps.onPermitted?.(context);
          } catch (error) {
            const denied = deps.onError(error);
            stamp(denied, requestId);
            audit(denied.status);
            return denied;
          }
        }
        try {
          const response = await (handler as unknown as (...a: unknown[]) => unknown)(...args);
          stamp(response, requestId);
          const download = isDownload(response) && response.status < 400;
          if (download) hardenDownload(response as Response);
          audit(response instanceof Response ? response.status : 200, download);
          return response;
        } catch (error) {
          audit(500);
          throw error;
        }
      });
    };
    return wrapped as unknown as F;
  };
}
