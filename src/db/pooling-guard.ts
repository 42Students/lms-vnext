/**
 * Tenant row-level security rides on SESSION-level settings (`set_config(..., false)`) that the app applies when it
 * checks a connection out of its OWN pool and clears when the connection is released (tenant-pool.ts).
 *
 * That is only safe when each app connection maps to one dedicated database session. Behind an external
 * TRANSACTION-mode pooler (PgBouncer, Supabase's pooler on 6543, Cloudflare Hyperdrive and similar) consecutive
 * statements can run on different server sessions, so a setting can be lost (no tenant filter) or can stay behind on a
 * session another request reuses (wrong tenant). Both break tenant isolation silently.
 *
 * So when tenant scoping is on we refuse to start against a database address that looks like one, unless an operator
 * has first moved the settings to `SET LOCAL` inside every transaction and acknowledged it with
 * DB_ALLOW_TRANSACTION_POOLER=acknowledged.
 */
import { rawEnv } from "@/config/env";
const POOLER_PORTS = new Set(["6432", "6543"]);
const POOLER_HOST_MARKERS = ["pooler.", "pgbouncer", "hyperdrive", "-pooler."];

export function looksLikeTransactionPooler(connectionString: string): boolean {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (POOLER_PORTS.has(url.port)) return true;
  if (POOLER_HOST_MARKERS.some((marker) => host.includes(marker))) return true;
  const params = url.searchParams;
  if (params.get("pgbouncer")?.toLowerCase() === "true") return true;
  return false;
}

export function assertTenantScopePoolingSafe(
  connectionString: string | undefined,
  env: Record<string, string | undefined> = rawEnv(),
): void {
  if (env["DB_TENANT_SCOPE"] !== "on") return;
  if (!connectionString) return;
  if (!looksLikeTransactionPooler(connectionString)) return;
  if (env["DB_ALLOW_TRANSACTION_POOLER"] === "acknowledged") return;
  throw new Error(
    "Refusing to start: DB_TENANT_SCOPE=on needs a direct or session-mode database connection. The configured address " +
      "looks like a transaction-mode pooler, which can drop or leak the per-request college setting. Use the direct " +
      "address, or move the settings to SET LOCAL inside every transaction first.",
  );
}
