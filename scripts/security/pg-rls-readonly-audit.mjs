/**
 * Read-only PostgreSQL runtime-principal and RLS readiness inventory.
 * Execute with the ACTUAL application DATABASE_URL (not a migration/superuser
 * account) to inspect production security posture. Collects catalog metadata,
 * never tenant rows or connection strings.
 *
 *   DATABASE_URL='...' node scripts/security/pg-rls-readonly-audit.mjs --strict
 *
 * --strict fails for detected privileged app principals (including SET ROLE
 * escalation into elevated/owner/truncate-capable roles), direct-tenant RLS
 * omissions, accessible owner-rights views/materialized views, or executable
 * SECURITY DEFINER routines until these are independently reviewed. All
 * indirect tenant-lineage tables still REQUIRE manual FK-lineage review.
 * A green report does NOT certify RLS: policy predicates, privileges,
 * SECURITY DEFINER routines and tenant-context isolation require live tests.
 */
import { pathToFileURL } from "node:url";
import pg from "pg";
const { Pool } = pg;

export function classifySecurityCatalog(principal, tables, { views = [], routines = [] } = {}) {
  const findings = [];
  if (principal.is_superuser || principal.can_bypass_rls) {
    findings.push({ severity: "CRITICAL", code: "PRIVILEGED_APP_DB_ROLE", table: null });
  }
  if (principal.can_create_role || principal.can_create_database ||
      principal.can_create_schema || principal.can_create_in_database) {
    findings.push({ severity: "HIGH", code: "APP_DB_ROLE_CAN_CREATE", table: null });
  }
  // The initial current_user is not the entire privilege boundary. A login
  // may switch to a role whose privileges were deliberately not inherited.
  if (principal.can_set_privileged_role === true) {
    findings.push({ severity: "CRITICAL", code: "APP_CAN_SET_PRIVILEGED_DB_ROLE", table: null });
  }
  if (principal.can_bypass_tenant_rls_by_ownership === true) {
    findings.push({ severity: "CRITICAL", code: "APP_ROLE_CAN_BYPASS_TENANT_RLS_BY_OWNERSHIP", table: null });
  }
  if (principal.can_truncate_tenant_tables === true) {
    findings.push({ severity: "CRITICAL", code: "APP_ROLE_CAN_TRUNCATE_TENANT_TABLES", table: null });
  }
  for (const table of tables) {
    if (table.tenant_key_columns.length === 0) continue;
    const relation = table.schema_name
      ? table.schema_name + "." + table.table_name : table.table_name;
    // PostgreSQL RLS does NOT restrict TRUNCATE. A runtime role with that
    // table privilege can delete every tenant row regardless of USING/CHECK.
    if (table.can_truncate === true) {
      findings.push({ severity: "CRITICAL", code: "APP_CAN_TRUNCATE_TENANT_TABLE", table: relation });
    }
    if (!table.rls_enabled) {
      findings.push({ severity: "HIGH", code: "TENANT_KEY_TABLE_NO_RLS", table: relation });
      continue;
    }
    if (table.policy_count === 0) {
      findings.push({ severity: "HIGH", code: "TENANT_KEY_TABLE_NO_POLICY", table: relation });
    }
    if (table.is_effective_owner && !table.rls_forced) {
      findings.push({ severity: "CRITICAL", code: "APP_OWNS_TABLE_WITHOUT_FORCE_RLS", table: relation });
    }
    // A permissive policy with no tenant predicate can expose every row
    // even when a second, seemingly restrictive permissive policy exists:
    // PostgreSQL ORs permissive policies. A separately applicable RESTRICTIVE
    // policy can still narrow the result and requires manual predicate review.
    // This checks only obvious unconditional reads, not all unsafe expressions.
    if (table.can_select === true &&
        table.unconditional_select_policy_count > 0 &&
        table.restrictive_select_policy_count === 0) {
      findings.push({ severity: "CRITICAL", code: "APP_UNSCOPED_PERMISSIVE_SELECT", table: relation });
    }
    // PostgreSQL combines PERMISSIVE policies with OR and then applies every
    // applicable RESTRICTIVE policy with AND. USING controls the OLD row for
    // UPDATE/DELETE; WITH CHECK controls the NEW row for INSERT/UPDATE.
    // UPDATE can be dangerous independently in either direction: a scoped
    // USING with WITH CHECK(true) permits moving a permitted row into another
    // college; scoped WITH CHECK with USING(true) permits editing other
    // colleges' existing rows. These are deliberately separate findings.
    const writeChecks = [
      ["INSERT", "can_insert", "unconditional_insert_check_policy_count",
        "restrictive_insert_check_policy_count", "APP_UNSCOPED_PERMISSIVE_INSERT"],
      ["UPDATE_USING", "can_update", "unconditional_update_using_policy_count",
        "restrictive_update_using_policy_count", "APP_UNSCOPED_PERMISSIVE_UPDATE_USING"],
      ["UPDATE_CHECK", "can_update", "unconditional_update_check_policy_count",
        "restrictive_update_check_policy_count", "APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK"],
      ["DELETE", "can_delete", "unconditional_delete_using_policy_count",
        "restrictive_delete_using_policy_count", "APP_UNSCOPED_PERMISSIVE_DELETE"],
    ];
    for (const [, grant, unconditional, restriction, code] of writeChecks) {
      if (table[grant] === true && table[unconditional] > 0 &&
          table[restriction] === 0) {
        findings.push({ severity: "CRITICAL", code, table: relation });
      }
    }
  }
  // PostgreSQL views execute with their owner's permissions by default.
  // A superuser-owned view can bypass the RLS on its underlying tables even
  // when the application login itself has no BYPASSRLS privilege. Materialized
  // views hold precomputed rows and do not inherit underlying table RLS.
  // These are REVIEW REQUIRED findings, not proof of an exploitable leak.
  for (const view of views) {
    if (!view.can_select) continue;
    const viewName = view.schema_name + "." + view.view_name;
    if (view.relation_kind === "materialized_view") {
      findings.push({ severity: "HIGH", code: "APP_READABLE_MATERIALIZED_VIEW_REQUIRES_REVIEW", table: viewName });
    } else if (view.security_invoker !== true) {
      findings.push({ severity: "HIGH", code: "APP_READABLE_OWNER_RIGHTS_VIEW_REQUIRES_REVIEW", table: viewName });
    }
  }
  // An executable SECURITY DEFINER function/procedure runs under the defining
  // owner's privileges. It may bypass application role grants and tenant RLS.
  // Even a safe, deliberately scoped routine needs a separate reviewed proof.
  for (const routine of routines) {
    if (routine.can_execute && routine.security_definer) {
      findings.push({ severity: "HIGH", code: "APP_EXECUTABLE_SECURITY_DEFINER_REQUIRES_REVIEW",
        table: routine.routine_signature });
    }
  }
  return findings;
}

const PRINCIPAL_QUERY = `
SELECT current_user::text AS runtime_user, session_user::text AS session_login,
       r.rolsuper AS is_superuser,
       r.rolbypassrls AS can_bypass_rls,
       r.rolcreaterole AS can_create_role,
       r.rolcreatedb AS can_create_database,
       -- Review creation privileges throughout the application database,
       -- including non-public schemas and roles reachable through SET ROLE.
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_namespace ns
         WHERE ns.nspname NOT IN ('pg_catalog','information_schema')
           AND ns.nspname NOT LIKE 'pg_toast%'
           AND ns.nspname NOT LIKE 'pg_temp_%'
           AND (has_schema_privilege(current_user, ns.oid, 'CREATE')
             OR EXISTS (
               SELECT 1 FROM pg_catalog.pg_roles candidate
               WHERE pg_has_role(session_user, candidate.oid, 'SET')
                 AND has_schema_privilege(candidate.oid, ns.oid, 'CREATE')
             ))
       ) AS can_create_schema,
       (has_database_privilege(current_user, current_database(), 'CREATE')
         OR EXISTS (
           SELECT 1 FROM pg_catalog.pg_roles candidate
           WHERE pg_has_role(session_user, candidate.oid, 'SET')
             AND has_database_privilege(candidate.oid, current_database(), 'CREATE')
         )) AS can_create_in_database,
       -- Non-inherited role membership can still permit an explicit SET ROLE
       -- into a principal with superuser, BYPASSRLS or DDL attributes.
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_roles elevated
         WHERE (elevated.rolsuper OR elevated.rolbypassrls
            OR elevated.rolcreatedb OR elevated.rolcreaterole)
           AND pg_has_role(session_user, elevated.oid, 'SET')
       ) AS can_set_privileged_role,
       -- Ownership bypass applies even without BYPASSRLS, unless FORCE RLS.
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_class owned
         JOIN pg_catalog.pg_namespace ns ON ns.oid = owned.relnamespace
         WHERE owned.relkind IN ('r','p')
           AND ns.nspname NOT IN ('pg_catalog','information_schema')
           AND ns.nspname NOT LIKE 'pg_toast%'
           AND ns.nspname NOT LIKE 'pg_temp_%'
           AND (NOT owned.relforcerowsecurity OR NOT owned.relrowsecurity)
           AND EXISTS (
             SELECT 1 FROM pg_catalog.pg_attribute a
             WHERE a.attrelid=owned.oid AND a.attnum>0 AND NOT a.attisdropped
               AND a.attname IN ('college_id','organization_id')
           )
           AND (pg_has_role(current_user, owned.relowner, 'USAGE')
             OR pg_has_role(session_user, owned.relowner, 'SET'))
       ) AS can_bypass_tenant_rls_by_ownership,
       -- TRUNCATE bypasses RLS and may also be acquired via SET ROLE.
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_class target
         JOIN pg_catalog.pg_namespace ns ON ns.oid = target.relnamespace
         WHERE target.relkind IN ('r','p')
           AND ns.nspname NOT IN ('pg_catalog','information_schema')
           AND ns.nspname NOT LIKE 'pg_toast%'
           AND ns.nspname NOT LIKE 'pg_temp_%'
           AND EXISTS (
             SELECT 1 FROM pg_catalog.pg_attribute a
             WHERE a.attrelid=target.oid AND a.attnum>0 AND NOT a.attisdropped
               AND a.attname IN ('college_id','organization_id')
           )
           AND (has_table_privilege(current_user, target.oid, 'TRUNCATE')
             OR EXISTS (
               SELECT 1 FROM pg_catalog.pg_roles candidate
               WHERE pg_has_role(session_user, candidate.oid, 'SET')
                 AND has_table_privilege(candidate.oid, target.oid, 'TRUNCATE')
             ))
       ) AS can_truncate_tenant_tables
FROM pg_catalog.pg_roles AS r
WHERE r.rolname = current_user
`;

// Inspect both sides of write policies: INSERT checks new values; UPDATE
// combines an old-row USING decision with a distinct new-row WITH CHECK
// decision; DELETE checks old rows. SQL below is generated ONLY from this
// hardcoded matrix (no user, environment, table-name or DB data interpolation).
const WRITE_POLICY_MATRIX = Object.freeze([
  ["insert_check", "a", "COALESCE(pg_get_expr(p.polwithcheck,p.polrelid), pg_get_expr(p.polqual,p.polrelid), 'true')"],
  ["update_using", "w", "COALESCE(pg_get_expr(p.polqual,p.polrelid), 'true')"],
  ["update_check", "w", "COALESCE(pg_get_expr(p.polwithcheck,p.polrelid), pg_get_expr(p.polqual,p.polrelid), 'true')"],
  ["delete_using", "d", "COALESCE(pg_get_expr(p.polqual,p.polrelid), 'true')"],
]);
const WRITE_POLICY_COUNTS_QUERY = WRITE_POLICY_MATRIX.flatMap(([name, command, predicate]) =>
  ["unconditional", "restrictive"].map(kind => {
    const permissive = kind === "unconditional";
    return `(SELECT count(*)::integer FROM pg_catalog.pg_policy p
    WHERE p.polrelid=c.oid
      AND p.polpermissive = ${permissive}
      AND p.polcmd IN ('*','${command}')
      AND ${predicate} ${permissive ? "= 'true'" : "<> 'true'"}
      AND (0::oid=ANY(p.polroles) OR EXISTS (
        SELECT 1 FROM unnest(p.polroles) AS role_id(id)
        WHERE pg_has_role(current_user,role_id.id,'USAGE')
      ))
  ) AS ${kind}_${name}_policy_count`;
  })
).join(",\n  ") + ",";

const TABLES_QUERY = `
SELECT
  n.nspname::text AS schema_name,
  c.relname::text AS table_name,
  pg_get_userbyid(c.relowner)::text AS table_owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  pg_has_role(current_user, c.relowner, 'USAGE') AS is_effective_owner,
  (SELECT count(*)::integer FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid) AS policy_count,
  -- Count policies that actually apply to the connected application role.
  -- PUBLIC (OID 0) always applies, and pg_has_role checks effective role
  -- inheritance; unrelated policies must not be mistaken for app protection.
  (SELECT count(*)::integer FROM pg_catalog.pg_policy p
    WHERE p.polrelid=c.oid AND p.polpermissive
      AND p.polcmd IN ('*','r')
      AND (p.polqual IS NULL OR pg_get_expr(p.polqual,p.polrelid)='true')
      AND (0::oid=ANY(p.polroles) OR EXISTS (
        SELECT 1 FROM unnest(p.polroles) AS role_id(id)
        WHERE pg_has_role(current_user,role_id.id,'USAGE')
      ))
  ) AS unconditional_select_policy_count,
  (SELECT count(*)::integer FROM pg_catalog.pg_policy p
    WHERE p.polrelid=c.oid AND NOT p.polpermissive
      AND p.polcmd IN ('*','r')
      -- A RESTRICTIVE USING(true) is a no-op and cannot rescue an
      -- otherwise unscoped permissive read policy.
      AND p.polqual IS NOT NULL
      AND pg_get_expr(p.polqual,p.polrelid) <> 'true'
      AND (0::oid=ANY(p.polroles) OR EXISTS (
        SELECT 1 FROM unnest(p.polroles) AS role_id(id)
        WHERE pg_has_role(current_user,role_id.id,'USAGE')
      ))
  ) AS restrictive_select_policy_count,
  ${WRITE_POLICY_COUNTS_QUERY}
  ARRAY(
    SELECT a.attname::text FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
      AND a.attname IN ('college_id','organization_id')
    ORDER BY a.attname
  ) AS tenant_key_columns,
  has_table_privilege(current_user, c.oid, 'SELECT') AS can_select,
  has_table_privilege(current_user, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(current_user, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(current_user, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(current_user, c.oid, 'TRUNCATE') AS can_truncate
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND has_schema_privilege(current_user, n.oid, 'USAGE')
  AND c.relkind IN ('r','p')
ORDER BY n.nspname, c.relname
`;

const VIEWS_QUERY = `
SELECT n.nspname::text AS schema_name,
       c.relname::text AS view_name,
       CASE WHEN c.relkind = 'm' THEN 'materialized_view' ELSE 'view' END AS relation_kind,
       COALESCE('security_invoker=true' = ANY(c.reloptions), false) AS security_invoker,
       has_table_privilege(current_user, c.oid, 'SELECT') AS can_select
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v','m')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND has_schema_privilege(current_user, n.oid, 'USAGE')
ORDER BY n.nspname, c.relname
`;

const ROUTINES_QUERY = `
SELECT p.oid::regprocedure::text AS routine_signature,
       p.prosecdef AS security_definer,
       has_function_privilege(current_user, p.oid, 'EXECUTE') AS can_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef
  AND p.prokind IN ('f','p')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND has_schema_privilege(current_user, n.oid, 'USAGE')
ORDER BY p.oid::regprocedure::text
`;

export async function auditPostgresSecurity(databaseUrl) {
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
    statement_timeout: 10_000,
    application_name: "vnext_readonly_security_inventory",
  });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN READ ONLY");
    const { rows: principalRows } = await client.query(PRINCIPAL_QUERY);
    const { rows: tables } = await client.query(TABLES_QUERY);
    const { rows: views } = await client.query(VIEWS_QUERY);
    const { rows: routines } = await client.query(ROUTINES_QUERY);
    await client.query("COMMIT");
    const principal = principalRows[0];
    if (!principal) throw new Error("DATABASE_PRINCIPAL_NOT_FOUND");
    return {
      audit: "PG_RLS_READONLY_CATALOG_V1",
      principal,
      summary: {
        total_tables: tables.length,
        direct_tenant_key_tables: tables.filter(t => t.tenant_key_columns.length > 0).length,
        tables_needing_lineage_review: tables.filter(t => t.tenant_key_columns.length === 0).length,
        rls_enabled: tables.filter(t => t.rls_enabled).length,
        forced_rls: tables.filter(t => t.rls_forced).length,
        accessible_views: views.filter(v => v.can_select).length,
        accessible_security_definer_routines: routines.filter(r => r.can_execute).length,
      },
      findings: classifySecurityCatalog(principal, tables, { views, routines }),
      tables,
      views,
      routines,
      limitations: [
        "No table rows were read or altered",
        "Obvious unconditional SELECT/INSERT/UPDATE/DELETE policies and SET ROLE escalation are screened, but predicates, applicable privileges and runtime tenant context require independent proof",
        "Indirect tenant ownership and policy expressions require manual review",
        "Owner-rights views, materialized views and SECURITY DEFINER routines require reviewed authorization proofs; their presence alone is not a proven leak",
        "Passing is not a substitute for cross-tenant read/write adversarial tests",
      ],
    };
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const strict = process.argv.includes("--strict");
    const report = await auditPostgresSecurity(process.env.DATABASE_URL);
    // Catalog metadata only; never print the connection string or user data.
    console.log(JSON.stringify(report, null, 2));
    if (strict && report.findings.length > 0) process.exitCode = 1;
  } catch (error) {
    // An endpoint, username or credential from a driver error may be private.
    console.error("PG_RLS_AUDIT_UNAVAILABLE", error instanceof Error ? error.name : "ERROR");
    process.exitCode = 1;
  }
}
