import "server-only";
import { getDb } from "@/db/client";
import { allowRequest as allowInMemory } from "@/auth/ip-rate-limit";
import { createSharedStore } from "@/security/shared-store-core";

/**
 * Wiring for the cross-instance security store. Off unless SECURITY_SHARED_STORE=on (the migration must be applied
 * first); when on, a database error never blocks traffic: the call falls back to this process's memory and logs once.
 */
const store = createSharedStore((query) => getDb().execute(query) as never);
const enabled = () => process.env["SECURITY_SHARED_STORE"] === "on";
let warned = false;
function degraded(error: unknown) {
  if (warned) return;
  warned = true;
  console.warn(JSON.stringify({ severity: "WARNING", event: "security.shared_store_degraded", error: error instanceof Error ? error.name : "unknown" }));
}
function maybeSweep() {
  if (Math.random() < 0.002) void store.sweep().catch(() => undefined);
}

export async function allowRequestShared(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!enabled()) return allowInMemory(key, limit, windowMs);
  try {
    maybeSweep();
    return await store.hit(key, limit, windowMs);
  } catch (error) {
    degraded(error);
    return allowInMemory(key, limit, windowMs);
  }
}

/** True the first time a delivery key is seen. Falls back to the per-process claim when the store is off or failing. */
export async function claimDeliveryShared(key: string, ttlSeconds: number, fallback: (key: string, ttl: number) => Promise<boolean>): Promise<boolean> {
  if (!enabled()) return fallback(key, ttlSeconds);
  try {
    maybeSweep();
    return await store.claimOnce(key, ttlSeconds);
  } catch (error) {
    degraded(error);
    return fallback(key, ttlSeconds);
  }
}
