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

/** First hop of X-Forwarded-For (set by the load balancer), else unknown. */
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

/** For tests only. */
export function resetIpRateLimitForTests() {
  windows.clear();
}
