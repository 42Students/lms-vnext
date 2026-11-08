import { randomUUID } from "node:crypto";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { runAsSystem } from "@/db/tenant-context";
import { recordSecurityEvent } from "@/security/audit-store";
import { createInternalRoute } from "@/security/internal-route-core";
import { claimDeliveryShared } from "@/security/shared-store";

// Per-process fallback when the shared store is off (single replica / development).
const localNonces = new Map<string, number>();
async function claimLocalNonce(key: string, ttlSeconds: number): Promise<boolean> {
  const now = Date.now();
  for (const [k, expires] of localNonces) if (expires < now) localNonces.delete(k);
  if (localNonces.has(key)) return false;
  localNonces.set(key, now + ttlSeconds * 1000);
  return true;
}

/** The one way to define a machine-to-machine route. See docs/security/central-security-architecture.md (L10). */
export const internalRoute = createInternalRoute({
  readSecret: (name) => process.env[name],
  readJson: readBoundedJsonBody,
  readEmpty: async (request) => {
    const body = await readBoundedUtf8Body(request, 0);
    return body.kind === "OK" && body.body === "";
  },
  onError: apiErrorResponse,
  runInSystemScope: runAsSystem,
  newRequestId: () => randomUUID(),
  // INTERNAL_REPLAY_PROTECTION=on makes every machine call carry x-lms-timestamp and a one-time x-lms-nonce.
  replayRequired: () => process.env["INTERNAL_REPLAY_PROTECTION"] === "on",
  claimNonce: (key, ttl) => claimDeliveryShared(key, ttl, claimLocalNonce),
  onDenied: (event) => {
    // Structured, secret-free denial record; the credential is never logged.
    recordSecurityEvent({ event: "internal.denied", outcome: "denied", requestId: event.requestId, target: event.route, detail: { reason: event.reason } });
    console.warn(JSON.stringify({ severity: "WARNING", event: "internal.route_denied", ...event }));
  },
});
