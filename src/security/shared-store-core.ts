import { sql, type SQL } from "drizzle-orm";

/**
 * Cross-instance security state (docs/security/central-security-architecture.md, layers L8 and L10): rate-limit windows
 * and webhook delivery claims in one small table, so a replay or a burst is caught no matter which server instance
 * receives it. Pure: the caller injects `run`, so every statement is covered without a database here and by
 * scripts/shared-store-acceptance.mjs against PostgreSQL in CI.
 *
 * Both operations are single atomic statements (no read-then-write race).
 */
export type StoreRun = (query: SQL) => Promise<{ rows: Array<Record<string, unknown>> }>;

/** The statements, kept as plain text so the CI acceptance script can run the identical SQL. */
export const CLAIM_ONCE_SQL = `INSERT INTO security_shared_store (key, kind, count, window_start, expires_at)
VALUES ($1, 'claim', 1, now(), now() + ($2::int * interval '1 second'))
ON CONFLICT (key) DO UPDATE
  SET count = 1, window_start = now(), expires_at = EXCLUDED.expires_at
  WHERE security_shared_store.expires_at <= now()
RETURNING key`;

export const RATE_HIT_SQL = `INSERT INTO security_shared_store (key, kind, count, window_start, expires_at)
VALUES ($1, 'rate', 1, now(), now() + ($2::int * interval '1 millisecond'))
ON CONFLICT (key) DO UPDATE
  SET count = CASE WHEN security_shared_store.window_start + ($2::int * interval '1 millisecond') <= now() THEN 1 ELSE security_shared_store.count + 1 END,
      window_start = CASE WHEN security_shared_store.window_start + ($2::int * interval '1 millisecond') <= now() THEN now() ELSE security_shared_store.window_start END,
      expires_at = CASE WHEN security_shared_store.window_start + ($2::int * interval '1 millisecond') <= now() THEN now() + ($2::int * interval '1 millisecond') ELSE security_shared_store.expires_at END
RETURNING count`;

export const RELEASE_SQL = `DELETE FROM security_shared_store WHERE key = $1 AND kind = 'claim'`;

export const SWEEP_SQL = `DELETE FROM security_shared_store WHERE key IN (SELECT key FROM security_shared_store WHERE expires_at < now() - interval '1 minute' LIMIT 5000)`;

function bound(query: string, params: unknown[]): SQL {
  // $1/$2 placeholders -> drizzle parameters, in order of appearance.
  const parts = query.split(/\$\d+(?:::\w+)?/);
  const tokens = [...query.matchAll(/\$(\d+)(::\w+)?/g)];
  let out = sql.raw(parts[0] ?? "");
  tokens.forEach((token, i) => {
    out = sql`${out}${params[Number(token[1]) - 1]}${sql.raw(token[2] ?? "")}${sql.raw(parts[i + 1] ?? "")}`;
  });
  return out;
}

export function createSharedStore(run: StoreRun) {
  return {
    /** Resolves true only the first time `key` is seen within `ttlSeconds` (an expired claim can be taken again). */
    async claimOnce(key: string, ttlSeconds: number): Promise<boolean> {
      const result = await run(bound(CLAIM_ONCE_SQL, [key, Math.max(1, Math.floor(ttlSeconds))]));
      return result.rows.length === 1;
    },
    /** Counts one hit in the key's window and resolves true while the count is within `limit`. */
    async hit(key: string, limit: number, windowMs: number): Promise<boolean> {
      const result = await run(bound(RATE_HIT_SQL, [key, Math.max(1, Math.floor(windowMs))]));
      return Number(result.rows[0]?.["count"] ?? Number.MAX_SAFE_INTEGER) <= limit;
    },
    /** Forgets a claim so a retry of a failed delivery is accepted. */
    async release(key: string): Promise<void> {
      await run(bound(RELEASE_SQL, [key]));
    },
    /** Deletes long-expired rows (bounded batch). Safe to call from any scheduler. */
    async sweep(): Promise<void> {
      await run(sql.raw(SWEEP_SQL));
    },
  };
}
