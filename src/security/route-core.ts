import type { ZodType } from "zod";

/**
 * Central API route pipeline (docs/security/central-security-architecture.md, layers L2/L3/L4/L7/L9).
 *
 * The order is deliberate and fail-fast: origin (writes) -> query shape -> authentication -> permission ->
 * body -> handler. An unauthorised caller never gets its body read; a cross-origin write never reaches
 * authentication. Every outcome carries a request id and `Cache-Control: private, no-store`.
 *
 * This module has no framework or database imports so every branch is unit-testable. `route.ts` wires
 * the real implementations.
 */

import { hardenDownload, isDownload } from "@/security/download-core";

export type BodyReadResult = { kind: "OK"; value: unknown } | { kind: "INVALID" } | { kind: "TOO_LARGE" };

export type RouteDeps<Context> = {
  getContext: () => Promise<Context>;
  /** Throws when the actor lacks the permission. Called only for a named permission. */
  requirePermission: (context: Context, permission: string) => void;
  isSameOrigin: (request: Request) => boolean;
  readJson: (request: Request, maxBytes: number) => Promise<BodyReadResult>;
  /** Maps any thrown value (session, authorization, validation, service errors) to a safe response. */
  onError: (error: unknown) => Response;
  newRequestId: () => string;
  /**
   * Abuse control (layer L8). Resolves true when the request is within budget for `key`. Optional so the core
   * stays framework-free; `route.ts` wires the real limiter.
   */
  allowRequest?: (key: string, limit: number, windowMs: number) => boolean | Promise<boolean>;
  /** Stable identity for a rate-limit key: the authenticated user id. */
  actorKey?: (context: Context) => string;
  /** Caller address for public routes (already canonicalised and trust-proxy aware). */
  clientAddress?: (request: Request) => string;
  /** Throws when the actor's sign-in is older than maxAgeSeconds (step-up authentication). */
  requireFreshAuth?: (context: Context, maxAgeSeconds: number) => Promise<void>;
  /** Per-address budget applied to every public route that does not set its own `rateLimit` (false opts out). */
  defaultPublicLimit?: { limit: number; windowMs: number };
  /** Budget applied to every authenticated state-changing request that does not set its own `rateLimit`. */
  defaultMutationLimit?: { limit: number; windowMs: number };
  /** Runs the handler inside the actor's database scope (row-level security reads it). Optional so the core stays framework-free. */
  runInScope?: <T>(context: Context, fn: () => T) => T;
  /**
   * Audit trail hook (layer L9). Called for authenticated routes after every state-changing request and every
   * 401/403/429 outcome. It receives identifiers only: never the body, query values or headers. A throwing hook
   * never changes the response.
   */
  onAudit?: (event: {
    requestId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    context: Context | null;
    /** True when the response was a file download (an export), audited even for GET. */
    download?: boolean;
  }) => void;
};

type Common = {
  /** Validated against the query string; duplicate keys are rejected (parameter pollution). */
  query?: ZodType;
  /** Query keys that may legitimately repeat (read with getAll from request.url). All other duplicates are rejected. */
  repeatableQuery?: readonly string[];
  /** Per-actor (authenticated) or per-address (public) request budget; `false` opts out of the central default. */
  rateLimit?: { limit: number; windowMs?: number } | false;
};

export type UserRouteConfig<Permission extends string, B> = Common & {
  auth: "user";
  /**
   * A registered permission name, or "service-enforced" when the service the handler calls performs the
   * check. "actor-owned" is for routes whose only authority is the signed-in actor's own identity or grants
   * (recruiter, student self-service) checked in the handler; it needs no registry permission but is counted by the ratchet.
   * "service-enforced" is tracked debt (ratchet) until every route names its permission.
   */
  permission: Permission | "service-enforced" | "actor-owned";
  /**
   * Step-up authentication for sensitive actions (role/permission changes, user disable/delete, bulk export or
   * import, secret/integration and tenant settings): the session must have been signed in within
   * `maxAgeSeconds` (default 900). Otherwise the request fails with the standard RECENT_SIGN_IN_REQUIRED outcome.
   */
  stepUp?: true | { maxAgeSeconds: number };
  body?: { schema: ZodType<B>; maxBytes: number };
  csrf?: true;
};

export type PublicRouteConfig<B> = Common & {
  auth: "public";
  /** Why this route may be called without a session. Required, reviewed and listed by the guard. */
  publicReason: string;
  body?: { schema: ZodType<B>; maxBytes: number };
  csrf?: true;
} | (Common & {
  auth: "public";
  publicReason: string;
  /** Why a state-changing request may omit the same-origin check (e.g. a signed machine callback). */
  csrfExemptReason: string;
  body?: { schema: ZodType<B>; maxBytes: number };
  csrf: false;
});

export type RouteArgs<Context, B> = {
  request: Request;
  /** Present for auth: "user"; null for public routes. */
  context: Context | null;
  body: B;
  query: Record<string, string>;
  params: Record<string, string>;
  requestId: string;
};

export type RouteContext = { params?: Promise<Record<string, string>> | Record<string, string> };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function jsonError(requestId: string, status: number, error: string) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store", "x-request-id": requestId } },
  );
}

/**
 * The route's shape, not the caller's URL: dynamic segments are replaced by a placeholder, so rotating an id
 * cannot mint a fresh rate-limit bucket (and cannot grow the store without bound).
 */
export function routePattern(pathname: string, params: Record<string, string | string[]>): string {
  const dynamic = new Set<string>();
  for (const value of Object.values(params)) for (const part of Array.isArray(value) ? value : [value]) dynamic.add(part);
  return pathname
    .split("/")
    .map((segment) => {
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch {
        /* keep the raw segment */
      }
      return dynamic.has(decoded) ? ":p" : segment;
    })
    .join("/");
}

function rateLimited(requestId: string, windowMs: number) {
  return Response.json(
    { error: "RATE_LIMITED" },
    { status: 429, headers: { "Cache-Control": "private, no-store", "x-request-id": requestId, "Retry-After": String(Math.max(1, Math.ceil(windowMs / 1000))) } },
  );
}

function withHeaders(response: Response, requestId: string) {
  const headers = new Headers(response.headers);
  if (!headers.has("x-request-id")) headers.set("x-request-id", requestId);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "private, no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function createRoute<Context, Permission extends string = string>(deps: RouteDeps<Context>) {
  return function route<B = undefined>(
    config: UserRouteConfig<Permission, B> | PublicRouteConfig<B>,
    handler: (args: RouteArgs<Context, B>) => Promise<Response> | Response,
  ) {
    if (config.auth === "public" && !config.publicReason.trim()) {
      throw new Error("A public route must state publicReason.");
    }
    if (config.auth === "public" && config.csrf === false && !("csrfExemptReason" in config && config.csrfExemptReason.trim())) {
      throw new Error("A route that skips the origin check must state csrfExemptReason.");
    }

    const core = async (
      request: Request,
      routeContext: RouteContext | undefined,
      requestId: string,
      actorRef: { context: Context | null },
    ): Promise<Response> => {
      try {
        const mutating = !SAFE_METHODS.has(request.method.toUpperCase());
        if (mutating && config.csrf !== false && !deps.isSameOrigin(request)) {
          return jsonError(requestId, 403, "INVALID_ORIGIN");
        }

        const url = new URL(request.url);
        const query: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          if (Object.prototype.hasOwnProperty.call(query, key)) {
            if (config.repeatableQuery?.includes(key)) continue;
            return jsonError(requestId, 400, "INVALID_REQUEST");
          }
          query[key] = value;
        }
        if (config.query) config.query.parse(query);

        // Public routes are throttled by address before any work; authenticated routes by actor once known.
        const routeParams = routeContext?.params ? await routeContext.params : {};
        const pattern = routePattern(url.pathname, routeParams);
        if (config.auth === "public" && config.rateLimit !== false && deps.allowRequest && deps.clientAddress) {
          const budget = config.rateLimit
            ? { limit: config.rateLimit.limit, windowMs: config.rateLimit.windowMs ?? 60_000 }
            : deps.defaultPublicLimit ?? null;
          if (budget && !(await deps.allowRequest(`pub:${request.method}:${pattern}:${deps.clientAddress(request)}`, budget.limit, budget.windowMs))) {
            return rateLimited(requestId, budget.windowMs);
          }
        }

        let context: Context | null = null;
        if (config.auth === "user") {
          context = await deps.getContext();
          actorRef.context = context;
          if (config.permission !== "service-enforced" && config.permission !== "actor-owned") deps.requirePermission(context, config.permission);
          if (config.stepUp) {
            if (!deps.requireFreshAuth) throw new Error("stepUp requires deps.requireFreshAuth.");
            await deps.requireFreshAuth(context, config.stepUp === true ? 900 : config.stepUp.maxAgeSeconds);
          }
          const budget = config.rateLimit === false ? null : config.rateLimit
            ? { limit: config.rateLimit.limit, windowMs: config.rateLimit.windowMs ?? 60_000 }
            : mutating ? deps.defaultMutationLimit ?? null : null;
          if (budget && deps.allowRequest && deps.actorKey) {
            if (!(await deps.allowRequest(config.rateLimit ? `user:${deps.actorKey(context)}:${request.method}:${pattern}` : `user:${deps.actorKey(context)}:writes`, budget.limit, budget.windowMs))) {
              return rateLimited(requestId, budget.windowMs);
            }
          }
        }

        let body = undefined as B;
        if (config.body) {
          const read = await deps.readJson(request, config.body.maxBytes);
          if (read.kind === "TOO_LARGE") return jsonError(requestId, 413, "INVALID_REQUEST");
          if (read.kind !== "OK") return jsonError(requestId, 400, "INVALID_REQUEST");
          body = config.body.schema.parse(read.value);
        }

        const params = routeParams;
        const run = () => handler({ request, context, body, query, params, requestId });
        const response = await (context !== null && deps.runInScope ? deps.runInScope(context, run) : run());
        return withHeaders(response, requestId);
      } catch (error) {
        return withHeaders(deps.onError(error), requestId);
      }
    };

    return async function handle(request: Request, routeContext?: RouteContext): Promise<Response> {
      const requestId = deps.newRequestId();
      const started = Date.now();
      const actorRef: { context: Context | null } = { context: null };
      const response = await core(request, routeContext, requestId, actorRef);
      const download = isDownload(response) && response.status < 400;
      if (download) hardenDownload(response);
      if (deps.onAudit && config.auth === "user") {
        const status = response.status;
        if (!SAFE_METHODS.has(request.method.toUpperCase()) || download || status === 401 || status === 403 || status === 429) {
          try {
            deps.onAudit({
              requestId,
              method: request.method.toUpperCase(),
              path: new URL(request.url).pathname,
              status,
              durationMs: Date.now() - started,
              context: actorRef.context,
              ...(download ? { download: true } : {}),
            });
          } catch {
            /* auditing must never change the response */
          }
        }
      }
      return response;
    };
  };
}
