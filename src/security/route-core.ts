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
  /** Runs the handler inside the actor's database scope (row-level security reads it). Optional so the core stays framework-free. */
  runInScope?: <T>(context: Context, fn: () => T) => T;
};

type Common = {
  /** Validated against the query string; duplicate keys are rejected (parameter pollution). */
  query?: ZodType;
  /** Query keys that may legitimately repeat (read with getAll from request.url). All other duplicates are rejected. */
  repeatableQuery?: readonly string[];
};

export type UserRouteConfig<Permission extends string, B> = Common & {
  auth: "user";
  /**
   * A registered permission name, or "service-enforced" when the service the handler calls performs the
   * check. "service-enforced" is tracked debt (ratchet) until every route names its permission.
   */
  permission: Permission | "service-enforced";
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

    return async function handle(request: Request, routeContext?: RouteContext): Promise<Response> {
      const requestId = deps.newRequestId();
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

        let context: Context | null = null;
        if (config.auth === "user") {
          context = await deps.getContext();
          if (config.permission !== "service-enforced") deps.requirePermission(context, config.permission);
        }

        let body = undefined as B;
        if (config.body) {
          const read = await deps.readJson(request, config.body.maxBytes);
          if (read.kind === "TOO_LARGE") return jsonError(requestId, 413, "INVALID_REQUEST");
          if (read.kind !== "OK") return jsonError(requestId, 400, "INVALID_REQUEST");
          body = config.body.schema.parse(read.value);
        }

        const params = routeContext?.params ? await routeContext.params : {};
        const run = () => handler({ request, context, body, query, params, requestId });
        const response = await (context !== null && deps.runInScope ? deps.runInScope(context, run) : run());
        return withHeaders(response, requestId);
      } catch (error) {
        return withHeaders(deps.onError(error), requestId);
      }
    };
  };
}
