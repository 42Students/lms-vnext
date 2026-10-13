/**
 * Per-process sliding-window limiter for unauthenticated auth endpoints.
 * It is a first defence against brute force; the per-contact send budget and
 * the per-challenge verification budget live in the database and are the
 * authoritative limits across replicas.
 */
type Window = { start: number; count: number };

const windows = new Map<string, Window>();

export function allowRequest(
  key: string,
  limit: number,
  windowMs = 60_000,
  now = Date.now(),
) {
  if (windows.size > 50_000) windows.clear();

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
}
