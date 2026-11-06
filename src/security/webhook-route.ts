import { randomUUID } from "node:crypto";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { runAsSystem } from "@/db/tenant-context";
import { createWebhookRoute } from "@/security/webhook-route-core";

/**
 * Replay memory for this process. A shared store (database or Redis) is the production target so replays are
 * rejected across instances; it plugs in here through `claimDelivery` without touching any route.
 */
const seen = new Map<string, number>();
export async function claimDeliveryInMemory(key: string, ttlSeconds: number, nowMs = Date.now()): Promise<boolean> {
  for (const [k, expires] of seen) if (expires <= nowMs) seen.delete(k);
  if (seen.has(key)) return false;
  if (seen.size >= 50_000) return true; // bounded memory: when full, fail open on dedupe only (signature still required)
  seen.set(key, nowMs + ttlSeconds * 1000);
  return true;
}

/** The one way to define an inbound provider webhook. See docs/security/central-security-architecture.md (L10). */
export const webhookRoute = createWebhookRoute({
  readSecret: (name) => process.env[name],
  readRaw: async (request, maxBytes) => {
    const body = await readBoundedUtf8Body(request, maxBytes);
    if (body.kind === "OK") return { kind: "OK", text: body.body };
    return body.kind === "TOO_LARGE" ? { kind: "TOO_LARGE" } : { kind: "INVALID" };
  },
  claimDelivery: (key, ttl) => claimDeliveryInMemory(key, ttl),
  now: () => Math.floor(Date.now() / 1000),
  onError: apiErrorResponse,
  runInSystemScope: runAsSystem,
  newRequestId: () => randomUUID(),
  onDenied: (event) => {
    console.warn(JSON.stringify({ severity: "WARNING", event: "webhook.route_denied", ...event }));
  },
});
