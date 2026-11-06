import type { Pool, PoolClient } from "pg";
import {
  RESET_TENANT_SETTINGS_SQL,
  applyTenantSettingsQuery,
  currentTenantScope,
} from "./tenant-context";

type Releasable = PoolClient & { __tenantScoped?: true };

/**
 * Makes every connection carry the current request's database identity (`app.*` settings).
 *
 *  - checkout: if a scope is active, apply it before the caller's first query;
 *  - release: always reset it first, and destroy the connection if the reset fails, so one request's
 *    identity can never reach the next request that reuses the connection.
 *
 * `pool.query()` is routed through checkout/release so non-transactional queries are scoped too.
 * When `enabled` is false the pool is returned untouched (default; no behaviour change).
 */
export function withTenantScope(pool: Pool, enabled: boolean): Pool {
  if (!enabled) return pool;

  const originalConnect = pool.connect.bind(pool) as () => Promise<PoolClient>;

  async function scopedConnect(): Promise<PoolClient> {
    const client = (await originalConnect()) as Releasable;
    const scope = currentTenantScope();
    if (!scope) return client;
    try {
      await client.query(applyTenantSettingsQuery(scope));
    } catch (error) {
      client.release(error instanceof Error ? error : new Error("tenant scope failed"));
      throw error;
    }
    if (!client.__tenantScoped) {
      client.__tenantScoped = true;
      const release = client.release.bind(client) as (err?: Error | boolean) => void;
      client.release = ((err?: Error | boolean) => {
        client.__tenantScoped = undefined;
        if (err) return release(err);
        client.query(RESET_TENANT_SETTINGS_SQL).then(
          () => release(),
          (resetError: unknown) => release(resetError instanceof Error ? resetError : new Error("tenant reset failed")),
        );
      }) as PoolClient["release"];
    }
    return client;
  }

  (pool as unknown as { connect: () => Promise<PoolClient> }).connect = scopedConnect;

  const originalQuery = pool.query.bind(pool) as (...args: unknown[]) => unknown;
  (pool as unknown as { query: (...args: unknown[]) => unknown }).query = (...args: unknown[]) => {
    if (!currentTenantScope() || typeof args[args.length - 1] === "function") return originalQuery(...args);
    return (async () => {
      const client = await scopedConnect();
      try {
        return await (client.query as (...a: unknown[]) => Promise<unknown>)(...args);
      } finally {
        client.release();
      }
    })();
  };

  return pool;
}
