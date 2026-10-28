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
  // A previously verified host is an authorization decision, not safe
  // presentation metadata. Never reuse it across requests: revocation,
  // host reassignment, and organization archival can commit on a different
  // application instance, which cannot invalidate this process's cache.
  if (hit && hit.expiresAt > Date.now() && hit.value.kind === "unknown")
    return hit.value;

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

  // Cache only negative lookups to limit unknown-host floods.
  // Every positive tenant grant must be read from currently committed SQL.
  if (value.kind === "college") return value;

  // Evict expired negative entries first, then the oldest at capacity.
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

/** Public bootstrap compatibility. Never serialize guessed or unverified
 * Host/X-Forwarded-Host values as college identities. Versioned fields let
 * old consumers upgrade without accidentally treating branding as auth. */
export function publicRequestTenantSnapshot(value:RequestTenant){
 const base={version:1 as const,resolvedHost:value.host,
   isPlatform:value.kind==="platform",isVerifiedCollege:value.kind==="college"};
 if(value.kind!=="college")return {...base,collegeId:null,organizationId:null,
   canonicalHost:null,redirectToCanonical:false};
 return {...base,collegeId:value.collegeId,
  organizationId:value.organizationId,canonicalHost:value.canonicalHost??value.host,
  redirectToCanonical:value.shouldRedirectToCanonicalHost===true};
}
/** Limit the effect of a just-verified or deleted DNS domain until next read. */
export function invalidateRequestTenantHost(host:string){
 try{cache.delete(normalizeRequestHost(hostWithoutPort(host)));}catch{/* Invalid host was never cached. */}
}
