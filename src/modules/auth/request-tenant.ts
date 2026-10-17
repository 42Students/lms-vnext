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

  if (cache.size > 500) cache.clear();
  cache.set(host, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** For tests only. */
export function clearRequestTenantCacheForTests() {
  cache.clear();
}
