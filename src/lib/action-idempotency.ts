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
