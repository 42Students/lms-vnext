import "server-only";

import { drizzleTenantDomainRepository } from "@/modules/tenant-domains/repository";
import { resolveTenantFromHost } from "@/modules/tenant-domains/service";
import { getPlatformHosts } from "./config";

/**
 * Maps the request `Host` to a tenant.
 *
 * - platform host (PLATFORM_HOSTS)  -> no college is implied
 * - verified college domain          -> that college only
 * - anything else                    -> unknown (callers fail closed)
 *
 * Only the `Host` header is trusted. `X-Forwarded-Host` is client-controlled
 * and is deliberately ignored.
 */
export type RequestTenant =
  | { kind: "platform"; host: string }
  | {
      kind: "college";
      host: string;
      collegeId: string;
      organizationId: string;
    }
  | { kind: "unknown"; host: string }
  | { kind: "unavailable"; host: string };

type CacheEntry = { value: RequestTenant; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15_000;
const CACHE_LIMIT = 500;

function hostWithoutPort(raw: string) {
  return raw.trim().toLowerCase().replace(/:\d+$/, "");
}

export async function resolveRequestTenant(
  hostHeader: string | null | undefined,
): Promise<RequestTenant> {
  const host = hostWithoutPort(hostHeader ?? "");

  if (!host) return { kind: "unknown", host };

  if (getPlatformHosts().has(host)) {
    return { kind: "platform", host };
  }

  const hit = cache.get(host);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  let value: RequestTenant;
  try {
    const resolved = await resolveTenantFromHost(
      host,
      drizzleTenantDomainRepository,
    );
    value = resolved
      ? {
          kind: "college",
          host,
          collegeId: resolved.collegeId,
          organizationId: resolved.organizationId,
        }
      : { kind: "unknown", host };
  } catch {
    // A transient domain lookup failure is not evidence that a college host is unknown.
    // Do not cache a false "unknown" response after a database outage.
    return {kind:"unavailable",host};
  }

  // Unknown-host floods must not flush every cached, verified college host;
  // evict expired entries first, then the oldest entry if still at capacity.
  const now = Date.now();
  if(cache.size >= CACHE_LIMIT&&!cache.has(host)){
    for(const [key,entry] of cache){
      if(entry.expiresAt<=now)cache.delete(key);
    }
    if(cache.size >= CACHE_LIMIT){
      const oldest=cache.keys().next().value;
      if(oldest!==undefined)cache.delete(oldest);
    }
  }
  // Refreshing an existing hostname also refreshes its insertion order.
  cache.delete(host);
  cache.set(host, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

/** For tests only. */
export function clearRequestTenantCacheForTests() {
  cache.clear();
}
