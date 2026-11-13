import { randomUUID } from "node:crypto";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedUtf8Body } from "@/lib/request-body";
import { runAsSystem } from "@/db/tenant-context";
import { claimDeliveryShared, releaseDeliveryShared } from "@/security/shared-store";
import { createWebhookRoute } from "@/security/webhook-route-core";

/**
 * Per-process replay memory, the fallback. With SECURITY_SHARED_STORE=on, claims go through the shared database
 * store (src/security/shared-store.ts) so replays are rejected across instances.
 */
const seen = new Map<string, number>();
const MAX_CLAIMS = 50_000;
let sinceSweep = 0;
export async function claimDeliveryInMemory(key: string, ttlSeconds: number, nowMs = Date.now()): Promise<boolean> {
  // Sweep expired claims every 500 calls (not every call), and evict the oldest when full: a flood of valid
  // deliveries must never turn into "accept every replay".
  if (++sinceSweep >= 500 || seen.size >= MAX_CLAIMS) {
    sinceSweep = 0;
    for (const [k, expires] of seen) if (expires <= nowMs) seen.delete(k);
    while (seen.size >= MAX_CLAIMS) seen.delete(seen.keys().next().value as string);
  }
  const expires = seen.get(key);
  if (expires !== undefined && expires > nowMs) return false;
  seen.set(key, nowMs + ttlSeconds * 1000);
  return true;
}
export async function releaseDeliveryInMemory(key: string): Promise<void> {
  seen.delete(key);
}

/** The one way to define an inbound provider webhook. See docs/security/central-security-architecture.md (L10). */
export const webhookRoute = createWebhookRoute({
  readSecret: (name) => process.env[name],
  readRaw: async (request, maxBytes) => {
    const body = await readBoundedUtf8Body(request, maxBytes);
    if (body.kind === "OK") return { kind: "OK", text: body.body };
    return body.kind === "TOO_LARGE" ? { kind: "TOO_LARGE" } : { kind: "INVALID" };
  },
  claimDelivery: (key, ttl) => claimDeliveryShared(key, ttl, (k, t) => claimDeliveryInMemory(k, t)),
  releaseDelivery: (key) => releaseDeliveryShared(key, releaseDeliveryInMemory),
  now: () => Math.floor(Date.now() / 1000),
  onError: apiErrorResponse,
  runInSystemScope: runAsSystem,
  newRequestId: () => randomUUID(),
  onDenied: (event) => {
    console.warn(JSON.stringify({ severity: "WARNING", event: "webhook.route_denied", ...event }));
  },
});
