/**
 * Read-only PostgreSQL runtime-principal and RLS readiness inventory.
 * Execute with the ACTUAL application DATABASE_URL (not a migration/superuser
 * account) to inspect production security posture. Collects catalog metadata,
 * never tenant rows or connection strings.
 *
 *   DATABASE_URL='...' node scripts/security/pg-rls-readonly-audit.mjs --strict
 *
 * --strict fails if the principal is privileged or a table with an explicit
 * college_id/organization_id column lacks effective RLS policy coverage.
 * Tables without a direct tenant column still REQUIRE manual FK-lineage review.
 * A green report does NOT certify RLS: policy predicates, privileges,
 * SECURITY DEFINER routines and tenant-context isolation require live tests.
 */
import { pathToFileURL } from "node:url";
import pg from "pg";
const { Pool } = pg;

export function classifySecurityCatalog(principal, tables) {
  const findings = [];
  if (principal.is_superuser || principal.can_bypass_rls) {
    findings.push({ severity: "CRITICAL", code: "PRIVILEGED_APP_DB_ROLE", table: null });
  }
  if (principal.can_create_role || principal.can_create_database ||
      principal.can_create_schema || principal.can_create_in_database) {
    findings.push({ severity: "HIGH", code: "APP_DB_ROLE_CAN_CREATE", table: null });
  }
  for (const table of tables) {
    if (table.tenant_key_columns.length === 0) continue;
    if (!table.rls_enabled) {
      findings.push({ severity: "HIGH", code: "TENANT_KEY_TABLE_NO_RLS", table: table.table_name });
      continue;
    }
    if (table.policy_count === 0) {
      findings.push({ severity: "HIGH", code: "TENANT_KEY_TABLE_NO_POLICY", table: table.table_name });
    }
    if (table.is_effective_owner && !table.rls_forced) {
      findings.push({ severity: "CRITICAL", code: "APP_OWNS_TABLE_WITHOUT_FORCE_RLS", table: table.table_name });
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
       has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_schema,
       has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_in_database
FROM pg_catalog.pg_roles AS r
WHERE r.rolname = current_user
`;

const TABLES_QUERY = `
SELECT
  c.relname::text AS table_name,
  pg_get_userbyid(c.relowner)::text AS table_owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  pg_has_role(current_user, c.relowner, 'USAGE') AS is_effective_owner,
  (SELECT count(*)::integer FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid) AS policy_count,
  ARRAY(
    SELECT a.attname::text FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
      AND a.attname IN ('college_id','organization_id')
    ORDER BY a.attname
  ) AS tenant_key_columns,
  has_table_privilege(current_user, c.oid, 'SELECT') AS can_select,
  has_table_privilege(current_user, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(current_user, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(current_user, c.oid, 'DELETE') AS can_delete
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
ORDER BY c.relname
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
      },
      findings: classifySecurityCatalog(principal, tables),
      tables,
      limitations: [
        "No table rows were read or altered",
        "Indirect tenant ownership and policy expressions require manual review",
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
