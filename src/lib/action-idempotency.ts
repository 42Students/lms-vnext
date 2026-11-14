/**
 * GR-34: use one key per logical mutation (publish, send, import, offer).
 * Usage: const key = createIdempotencyKey(); await apiFetch(url,
 *   withIdempotencyKey({ method: "POST", body }, key));
 * The API must also persist/deduplicate the key transactionally.
 */
export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function withIdempotencyKey<T extends RequestInit>(init: T, key: string): T {
  const headers = new Headers(init.headers);
  headers.set("Idempotency-Key", key);
  return { ...init, headers };
}

/**
 * One key per user intent. `next()` returns the same key until `settle()`, so a retry after a dropped connection (where
 * the server may already have done the work) is recognised as the same request. Call `settle()` as soon as the server has
 * answered, success or error: a refused request keeps its key claimed on the server, so the next try needs a new one.
 */
export function createAttemptKeys(): { next(): string; settle(): void } {
  let key: string | null = null;
  return {
    next() {
      key ??= createIdempotencyKey();
      return key;
    },
    settle() {
      key = null;
    },
  };
}
