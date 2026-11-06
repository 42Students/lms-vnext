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
let calls = 0;
function maybeSweep() {
  // One bounded batch every 200 calls per process keeps the table small without a scheduler.
  if (++calls % 200 === 0) void store.sweep().catch(() => undefined);
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

/**
 * True the first time a delivery key is seen. When the shared store is on this FAILS CLOSED: if it cannot be reached
 * the error propagates (the webhook answers 5xx and the provider retries) rather than accepting a delivery whose
 * replay it can no longer rule out. Rate limiting, by contrast, degrades to per-process memory (availability).
 */
export async function claimDeliveryShared(key: string, ttlSeconds: number, local: (key: string, ttl: number) => Promise<boolean>): Promise<boolean> {
  if (!enabled()) return local(key, ttlSeconds);
  maybeSweep();
  return store.claimOnce(key, ttlSeconds);
}

export async function releaseDeliveryShared(key: string, local: (key: string) => Promise<void>): Promise<void> {
  if (!enabled()) return local(key);
  await store.release(key);
}
