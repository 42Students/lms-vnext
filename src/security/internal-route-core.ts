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
  readJson: (request: Request, maxBytes: number) => Promise<
    { kind: "OK"; value: unknown } | { kind: "INVALID" } | { kind: "TOO_LARGE" }
  >;
  onError: (error: unknown) => Response;
  newRequestId: () => string;
  /** Called on every denial with a reason code. Never receives the credential. */
  onDenied?: (event: { route: string; reason: "ORIGIN" | "QUERY" | "CREDENTIAL" | "BODY"; requestId: string }) => void;
};

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
  /** Keep a route's existing denial body so callers and tests see no change. */
  denied?: { status: number; body: unknown };
};

const MIN_SECRET_BYTES = 32;

export function credentialMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  if (Buffer.byteLength(expected, "utf8") < MIN_SECRET_BYTES) return false;
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

    return async function handle(request: Request): Promise<Response> {
      const requestId = deps.newRequestId();
      const deny = (reason: "ORIGIN" | "QUERY" | "CREDENTIAL" | "BODY", status = denied.status, body: unknown = denied.body) => {
        deps.onDenied?.({ route: config.name, reason, requestId });
        return withHeaders(Response.json(body, { status }), requestId);
      };
      try {
        if (request.headers.has("origin")) return deny("ORIGIN");
        if (!config.allowQuery && new URL(request.url).search) return deny("QUERY", 400, { error: "INVALID_REQUEST" });

        const cred = config.credential;
        const provided =
          cred.kind === "header"
            ? request.headers.get(cred.header)
            : (() => {
                const auth = request.headers.get("authorization");
                return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
              })();
        if (!credentialMatches(provided, deps.readSecret(cred.secretEnv))) return deny("CREDENTIAL");

        let body = undefined as B;
        if (config.body) {
          const read = await deps.readJson(request, config.body.maxBytes);
          if (read.kind === "TOO_LARGE") return deny("BODY", 413, { error: "INVALID_REQUEST" });
          if (read.kind !== "OK") return deny("BODY", 400, { error: "INVALID_REQUEST" });
          body = config.body.schema.parse(read.value);
        }
        return withHeaders(await handler({ request, body, requestId }), requestId);
      } catch (error) {
        return withHeaders(deps.onError(error), requestId);
      }
    };
  };
}
