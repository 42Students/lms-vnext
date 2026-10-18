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
 * The caller IP behind the Google load balancer. The balancer appends
 * "<client ip>, <balancer ip>" to whatever X-Forwarded-For the caller sent,
 * so the leading entries are attacker-controlled and the trustworthy client
 * address is the second-to-last one. With a single entry (no balancer, as in
 * local development) that entry is used.
 */
export function clientIp(request: Request) {
  const parts = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || "unknown";
}

/** For tests only. */
export function resetIpRateLimitForTests() {
  windows.clear();
  nextExpiredSweepAt = 0;
}
