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

  async function scopedConnectPromise(): Promise<PoolClient> {
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

  type ConnectCallback = (error: Error | undefined, client?: PoolClient, done?: (err?: Error | boolean) => void) => void;

  /**
   * pg-pool's own `pool.query()` (and other internals) call `this.connect(callback)`. Because this replaces
   * `connect`, the callback form MUST still be honoured: ignoring it leaks the checked-out connection and the callback
   * never fires, which empties the pool and hangs every request (found on dev 2026-11-07).
   */
  function scopedConnect(callback?: ConnectCallback): Promise<PoolClient> | undefined {
    const promise = scopedConnectPromise();
    if (typeof callback !== "function") return promise;
    promise.then(
      (client) => callback(undefined, client, (err) => client.release(err)),
      (error: unknown) => callback(error instanceof Error ? error : new Error("tenant scope failed")),
    );
    return undefined;
  }

  (pool as unknown as { connect: typeof scopedConnect }).connect = scopedConnect;

  (pool as unknown as { query: (...args: unknown[]) => unknown }).query = (...args: unknown[]) => {
    const last = args[args.length - 1];
    const callback = typeof last === "function" ? (last as (error: Error | null, result?: unknown) => void) : null;
    const queryArgs = callback ? args.slice(0, -1) : args;
    const run = async () => {
      const client = await scopedConnectPromise();
      try {
        return await (client.query as (...a: unknown[]) => Promise<unknown>)(...queryArgs);
      } finally {
        client.release();
      }
    };
    if (!callback) return run();
    run().then(
      (result) => callback(null, result),
      (error: unknown) => callback(error instanceof Error ? error : new Error("query failed")),
    );
    return undefined;
  };

  return pool;
}
