import "server-only";

import { drizzleTenantDomainRepository } from "@/modules/tenant-domains/repository";
import { resolveTenantFromHost } from "@/modules/tenant-domains/service";
import {normalizeRequestHost} from "@/modules/tenant-domains/validation";
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
      /** Only an independently verified PRIMARY domain may be suggested. */
      canonicalHost?: string;
      shouldRedirectToCanonicalHost?: boolean;
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
  const rawHost = hostWithoutPort(hostHeader ?? "");

  if (!rawHost) return { kind: "unknown", host: rawHost };

  if (getPlatformHosts().has(rawHost)) {
    return { kind: "platform", host: rawHost };
  }
  // Never infer a tenant from www, X-Forwarded-Host, a scheme, or an alias.
  // Normalize the sole trusted Host header before looking up/cache-keying.
  let host: string;
  try {
    host = normalizeRequestHost(rawHost);
  } catch {
    return { kind: "unknown", host: rawHost };
  }

  const hit = cache.get(host);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  let value: RequestTenant;
  try {
    const resolved = await resolveTenantFromHost(
      host,
      drizzleTenantDomainRepository,
    );
    if (resolved) {
      // The repository's verified host lookup has already proved tenant scope.
      // Only a verified primary for that exact college may trigger an alias
      // redirect; an unverified/foreign or guessed primary must never do so.
      let canonicalHost: string | undefined;
      try {
        const domains = await drizzleTenantDomainRepository.listByCollege(
          resolved.collegeId,
        );
        const primary = domains.find(
          (domain) =>
            domain.isPrimary &&
            domain.isVerified &&
            domain.collegeId === resolved.collegeId &&
            domain.organizationId === resolved.organizationId,
        );
        if (primary) canonicalHost = normalizeRequestHost(primary.host);
      } catch {
        // Optional canonical metadata may fail independently. A verified
        // tenant remains usable; omit redirect rather than guessing.
      }
      value = {
        kind: "college",
        host,
        collegeId: resolved.collegeId,
        organizationId: resolved.organizationId,
        ...(canonicalHost
          ? {
              canonicalHost,
              shouldRedirectToCanonicalHost: host !== canonicalHost,
            }
          : {}),
      };
    } else {
      value = { kind: "unknown", host };
    }
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
      // A flood of never-verified Host headers must not evict verified tenants.
      // Prefer discarding an existing negative-cache entry. If every slot is
      // verified, return the unknown result without storing it.
      const negative=[...cache].find(([,entry])=>entry.value.kind==="unknown");
      if(negative)cache.delete(negative[0]);
      else if(value.kind==="unknown")return value;
      else {
        const oldest=cache.keys().next().value;
        if(oldest!==undefined)cache.delete(oldest);
      }
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
