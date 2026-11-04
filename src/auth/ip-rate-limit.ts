import { isIP } from "node:net";

/**
 * Per-process sliding-window limiter for unauthenticated auth endpoints.
 * It is a first defence against brute force; the per-contact send budget and
 * the per-challenge verification budget live in the database and are the
 * authoritative limits across replicas.
 */
type Window = { start: number; count: number };

const windows = new Map<string, Window>();
const MAX_WINDOWS = 50_000;
let nextExpiredSweepAt = 0;

export function allowRequest(
  key: string,
  limit: number,
  windowMs = 60_000,
  now = Date.now(),
) {
  // Never clear live buckets on capacity: otherwise an attacker can rotate
  // 50,001 spoofed client keys to reset every active throttling budget.
  // Reclaim expired windows infrequently; when saturated, fail closed for
  // unknown keys without denying legitimate existing buckets a fair count.
  if (windows.size >= MAX_WINDOWS && !windows.has(key)) {
    if (now >= nextExpiredSweepAt) {
      for (const [existingKey, window] of windows) {
        if (now - window.start >= windowMs) windows.delete(existingKey);
      }
      nextExpiredSweepAt = now + Math.max(1_000, Math.trunc(windowMs / 4));
    }
    if (windows.size >= MAX_WINDOWS) return false;
  }

  const current = windows.get(key);
  if (!current || now - current.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return true;
  }

  current.count += 1;
  return current.count <= limit;
}

/**
 * Canonicalize the selected address before it is used as a throttle key,
 * authentication audit tag or recorded session address. An arbitrary string
 * or equivalent IPv6 spellings must not create independent rate-limit buckets.
 */
function canonicalIp(candidate: string): string | null {
  const family = isIP(candidate);
  if (family === 4) return candidate;
  if (family !== 6) return null;
  try {
    // URL's IPv6 host serializer produces a stable compressed lowercase form.
    return new URL(`http://[${candidate}]/`).hostname.slice(1, -1);
  } catch {
    return null;
  }
}

/**
 * The caller IP behind the Google load balancer. The balancer appends
 * "<client ip>, <balancer ip>" to whatever X-Forwarded-For the caller sent,
 * so the leading entries are attacker-controlled and the trustworthy client
 * address is the second-to-last one. With a single entry (local development)
 * that entry is used.
 *
 * Never filter empty/malformed hops: doing so can shift an attacker-provided
 * entry into the trusted position. An invalid chain shares the coarse
 * "unknown" throttle bucket. This does not authenticate proxy provenance:
 * production must still block direct app access and sanitize edge headers.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  if (!forwarded || forwarded.length > 4096) return "unknown";

  // Only inspect the two positions added by the trusted edge, avoiding a
  // potentially long split/array allocation on unauthenticated requests.
  const lastComma = forwarded.lastIndexOf(",");
  // A real production Google LB must append both client and proxy addresses.
  // A lone, caller-writable forwarded value must never buy a fresh bucket.
  if (lastComma < 0) {
    if (process.env.NODE_ENV === "production") return "unknown";
    return canonicalIp(forwarded.trim()) ?? "unknown";
  }

  const proxy = forwarded.slice(lastComma + 1).trim();
  if (!canonicalIp(proxy)) return "unknown";
  const precedingComma = forwarded.lastIndexOf(",", lastComma - 1);
  const candidate = forwarded.slice(precedingComma + 1, lastComma).trim();
  return canonicalIp(candidate) ?? "unknown";
}

/** For tests only. */
export function resetIpRateLimitForTests() {
  windows.clear();
  nextExpiredSweepAt = 0;
}
