import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ZodType } from "zod";
import { credentialMatches } from "@/security/internal-route-core";

/**
 * Central pipeline for inbound provider webhooks (docs/security/central-security-architecture.md, layer L10).
 *
 * Order, fail-closed: browser Origin rejected -> bounded RAW body read (the signature covers the exact bytes)
 * -> authenticity (HMAC signature or shared token, constant-time, secret of at least 32 bytes) -> timestamp
 * tolerance (when the provider signs one) -> schema -> replay claim -> handler. Nothing in the denial says which
 * check failed, and nothing is parsed before authenticity is proven.
 *
 * The replay key is derived ONLY from authenticated bytes: the HMAC signature (which covers the timestamp and body),
 * or a hash of the body for shared-token providers. A header the provider does not sign (a delivery id an attacker can
 * rewrite) is never trusted for deduplication. A claim is released when the handler throws or answers 5xx, so the
 * provider's retry of a failed delivery is not refused as a duplicate.
 */

export type WebhookDeps = {
  readSecret: (name: string) => string | undefined;
  /** Exact request bytes as text, or a size / read failure. */
  readRaw: (request: Request, maxBytes: number) => Promise<{ kind: "OK"; text: string } | { kind: "TOO_LARGE" } | { kind: "INVALID" }>;
  /** Atomically records a delivery key; resolves true only the first time it is seen within ttlSeconds. */
  claimDelivery: (key: string, ttlSeconds: number) => Promise<boolean>;
  /** Forgets a claim (the handler failed, so the provider's retry must be accepted). Optional. */
  releaseDelivery?: (key: string) => Promise<void>;
  now: () => number; // epoch seconds
  onError: (error: unknown) => Response;
  newRequestId: () => string;
  /** Runs the handler inside a named system tenant scope (a provider is not a user). */
  runInSystemScope?: <T>(reason: string, fn: () => T) => T;
  onDenied?: (event: { route: string; reason: "ORIGIN" | "BODY" | "SIGNATURE" | "STALE" | "REPLAY" | "SCHEMA"; requestId: string }) => void;
};

export type WebhookAuth =
  | {
      kind: "hmac";
      /** Header carrying the signature, e.g. "x-hub-signature-256". */
      header: string;
      secretEnv: string;
      /** Literal prefix before the hex digest, e.g. "sha256=". */
      prefix?: string;
      /** Provider also signs a timestamp: the signed string is `${timestamp}.${rawBody}`. */
      timestamp?: { header: string; toleranceSeconds: number };
    }
  | { kind: "token"; header: string; secretEnv: string };

export type WebhookRouteConfig<B> = {
  name: string;
  auth: WebhookAuth;
  body: { schema: ZodType<B>; maxBytes: number };
  /** How long a delivery key is remembered (default 24h). */
  replayTtlSeconds?: number;
  /** Keep a route's existing denial body so providers/tests see no change. */
  denied?: { status: number; body: unknown };
};

const MIN_SECRET_BYTES = 32;

export function signWebhook(secret: string, signed: string): string {
  return createHmac("sha256", secret).update(signed, "utf8").digest("hex");
}

function hexEquals(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/i.test(a) || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

function withHeaders(response: Response, requestId: string) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  if (!headers.has("x-request-id")) headers.set("x-request-id", requestId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function createWebhookRoute(deps: WebhookDeps) {
  return function webhookRoute<B>(
    config: WebhookRouteConfig<B>,
    handler: (args: { request: Request; body: B; requestId: string }) => Promise<Response> | Response,
  ) {
    const denied = config.denied ?? { status: 401, body: { error: "UNAUTHORIZED" } };
    const ttl = config.replayTtlSeconds ?? 86_400;

    return async function handle(request: Request): Promise<Response> {
      const requestId = deps.newRequestId();
      const deny = (reason: "ORIGIN" | "BODY" | "SIGNATURE" | "STALE" | "REPLAY" | "SCHEMA", status = denied.status, body: unknown = denied.body) => {
        deps.onDenied?.({ route: config.name, reason, requestId });
        return withHeaders(Response.json(body, { status }), requestId);
      };
      try {
        if (request.headers.has("origin")) return deny("ORIGIN");
        const secret = deps.readSecret(config.auth.secretEnv);
        if (!secret || Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES) return deny("SIGNATURE");

        const raw = await deps.readRaw(request, config.body.maxBytes);
        if (raw.kind === "TOO_LARGE") return deny("BODY", 413, { error: "INVALID_REQUEST" });
        if (raw.kind !== "OK") return deny("BODY", 400, { error: "INVALID_REQUEST" });

        let replayKey: string;
        const auth = config.auth;
        if (auth.kind === "token") {
          if (!credentialMatches(request.headers.get(auth.header), secret)) return deny("SIGNATURE");
          replayKey = createHash("sha256").update(raw.text, "utf8").digest("hex");
        } else {
          let provided = request.headers.get(auth.header) ?? "";
          const prefix = auth.prefix ?? "";
          if (prefix) {
            if (!provided.startsWith(prefix)) return deny("SIGNATURE");
            provided = provided.slice(prefix.length);
          }
          let signed = raw.text;
          if (auth.timestamp) {
            const stamp = request.headers.get(auth.timestamp.header) ?? "";
            if (!/^[0-9]{1,12}$/.test(stamp)) return deny("SIGNATURE");
            signed = `${stamp}.${raw.text}`;
            if (!hexEquals(provided, signWebhook(secret, signed))) return deny("SIGNATURE");
            if (Math.abs(deps.now() - Number(stamp)) > auth.timestamp.toleranceSeconds) return deny("STALE");
          } else if (!hexEquals(provided, signWebhook(secret, signed))) {
            return deny("SIGNATURE");
          }
          replayKey = provided.toLowerCase();
        }

        let json: unknown;
        try {
          json = JSON.parse(raw.text);
        } catch {
          return deny("SCHEMA", 400, { error: "INVALID_REQUEST" });
        }
        const parsed = config.body.schema.safeParse(json);
        if (!parsed.success) return deny("SCHEMA", 400, { error: "INVALID_REQUEST" });

        const key = `${config.name}:${replayKey}`.slice(0, 200);
        if (!(await deps.claimDelivery(key, ttl))) return deny("REPLAY", 409, { error: "DUPLICATE_DELIVERY" });
        const release = () => deps.releaseDelivery?.(key).catch(() => undefined);
        const run = () => handler({ request, body: parsed.data, requestId });
        let response: Response;
        try {
          response = await (deps.runInSystemScope ? deps.runInSystemScope("webhook:" + config.name, run) : run());
        } catch (error) {
          await release();
          throw error;
        }
        if (response.status >= 500) await release();
        return withHeaders(response, requestId);
      } catch (error) {
        return withHeaders(deps.onError(error), requestId);
      }
    };
  };
}
