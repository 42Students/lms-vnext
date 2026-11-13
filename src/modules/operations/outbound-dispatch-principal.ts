import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

import { rawEnv } from "@/config/env";
/**
 * The trusted EMAIL dispatcher MUST NOT silently reuse the ordinary app
 * connection. Its login is provisioned separately by operations and receives
 * only the reviewed DB067 function/table privileges. No credential is saved
 * in source, logged or returned by an API.
 *
 * The registered DB067 functions are SECURITY INVOKER, so the operator must
 * separately grant narrow outbound_messages SELECT/UPDATE, suppression SELECT
 * and EXECUTE on the four functions to this dedicated role.
 * This module does not invent a production principal or enable dispatch.
 */
type DispatchState = {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
};

const state: DispatchState = {};

const ROLE = /^lms_[a-z][a-z0-9_]{2,55}$/;

function invalid(): never {
  throw new Error("OUTBOUND_DISPATCH_PRINCIPAL_NOT_VERIFIED");
}

function loginFromDatabaseUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return decodeURIComponent(u.username);
  } catch {
    return null;
  }
}

/** Only validates configuration shape and identity; live catalog proof below
 * is mandatory even when this static preflight succeeds.
 */
export function validateOutboundDispatchDbConfig(
  env: Record<string, string | undefined> = rawEnv(),
): { url: string; login: string } {
  const raw = env["DB10_DISPATCH_DATABASE_URL"] ?? "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return invalid();
  }
  const login = decodeURIComponent(url.username);
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname || !url.password || !url.pathname || url.pathname === "/" ||
      !ROLE.test(login) ||
      env["DB10_DISPATCH_DB_ROLE"] !== login ||
      url.searchParams.has("options") || url.searchParams.has("role") ||
      url.hash || url.username.includes("@")) {
    return invalid();
  }
  // The app can use a URL or separately configured Cloud SQL credentials.
  // Require explicit app-role identity if neither was supplied. Comparing
  // only raw URLs would miss the same login on a different hostname.
  const applicationUrlRaw = env["DATABASE_URL"];
  if (applicationUrlRaw) {
    // Distinct credentials must still target the SAME PostgreSQL database.
    // Otherwise a worker can silently drain a different deployment's queue.
    let applicationUrl: URL;
    try {
      applicationUrl = new URL(applicationUrlRaw);
    } catch {
      return invalid();
    }
    if (applicationUrl.hostname.toLowerCase() !== url.hostname.toLowerCase() ||
        (applicationUrl.port || "5432") !== (url.port || "5432") ||
        applicationUrl.pathname !== url.pathname) return invalid();
  }
  const applicationLogins = [
    env["DB10_APP_DB_ROLE"],
    loginFromDatabaseUrl(applicationUrlRaw ?? ""),
    env["DB_USER"],
    env["PGUSER"],
  ].filter((name): name is string => Boolean(name));
  // Every known app identity must differ: an incorrect optional override
  // must not mask that DATABASE_URL really uses the worker's login.
  if (!applicationLogins.length || applicationLogins.includes(login)) return invalid();
  return { url: raw, login };
}

export function getOutboundDispatchDb() {
  const config = validateOutboundDispatchDbConfig();
  if (!state.db) {
    state.pool = new Pool({
      connectionString: config.url,
      max: 2,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    state.db = drizzle(state.pool);
  }
  return state.db;
}

/**
 * Re-check PostgreSQL session identity and privileges before any claim, send
 * or completion. An env flag alone cannot make an application/superuser
 * session a trusted dispatcher. Reject broad application table access.
 * Changes to grants must never silently activate an existing worker.
 */
export async function requireOutboundDispatchPrincipal() {
  const config = validateOutboundDispatchDbConfig();
  const result = await getOutboundDispatchDb().execute<{
    login: string;
    session_login: string;
    elevated: boolean;
    claim: boolean;
    presend: boolean;
    complete: boolean;
    expire: boolean;
    outbound_read: boolean;
    outbound_write: boolean;
    app_users_read: boolean;
    app_members_read: boolean;
    app_leads_read: boolean;
  }>(sql`
    select current_user::text as login, session_user::text as session_login,
      (r.rolsuper or r.rolcreaterole or r.rolcreatedb or
       r.rolreplication or r.rolbypassrls) as elevated,
      has_function_privilege(current_user,
        'public.db10_claim_outbound_messages(text,integer,integer)', 'EXECUTE') as claim,
      has_function_privilege(current_user,
        'public.db10_check_outbound_pre_send(uuid,text,integer,text)', 'EXECUTE') as presend,
      has_function_privilege(current_user,
        'public.db10_complete_outbound_claim(uuid,text,integer,text,text,text,timestamptz)', 'EXECUTE') as complete,
      has_function_privilege(current_user,
        'public.db10_expire_unclaimed_outbound(integer)', 'EXECUTE') as expire,
      has_table_privilege(current_user, 'public.outbound_messages', 'SELECT') as outbound_read,
      has_table_privilege(current_user, 'public.outbound_messages', 'UPDATE') as outbound_write,
      has_table_privilege(current_user, 'public.users', 'SELECT') as app_users_read,
      has_table_privilege(current_user, 'public.college_memberships', 'SELECT') as app_members_read,
      has_table_privilege(current_user, 'public.placement_tpo_leads', 'SELECT') as app_leads_read
    from pg_roles r where r.rolname = current_user
  `);
  const r = result.rows[0];
  if (!r || r.login !== config.login || r.session_login !== config.login ||
      r.elevated || !r.claim || !r.presend || !r.complete || !r.expire ||
      !r.outbound_read || !r.outbound_write ||
      r.app_users_read || r.app_members_read || r.app_leads_read) {
    invalid();
  }
}

export async function closeOutboundDispatchDb() {
  const pool = state.pool;
  state.pool = undefined;
  state.db = undefined;
  if (pool) await pool.end();
}
