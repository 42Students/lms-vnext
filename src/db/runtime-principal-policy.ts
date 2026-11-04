/**
 * The web runtime must use a least-privileged PostgreSQL role, never the
 * migration/DB-owner principal. Fail readiness closed in real production.
 * This is a required baseline, NOT a substitute for tenant RLS policy review.
 */
export type DatabasePrincipalCapability = {
  is_superuser: boolean | null;
  can_bypass_rls: boolean | null;
  can_create_role: boolean | null;
  can_create_database: boolean | null;
  can_create_schema: boolean | null;
  can_create_in_database: boolean | null;
  can_set_privileged_role: boolean | null;
  can_bypass_tenant_rls_by_ownership: boolean | null;
};

export const DATABASE_APP_PRINCIPAL_DENIED = "DATABASE_APP_PRINCIPAL_UNSAFE";

/** Build-time NODE_ENV alone is not production; explicit APP_ENV is required. */
export function enforceProductionDatabasePrincipal(input: {
  nodeEnv: string | undefined;
  appEnv: string | undefined;
}) {
  return input.nodeEnv === "production" && input.appEnv === "production";
}

/**
 * Require positive proof that *every* privileged capability is false.
 * Database query failure or NULL must not be treated as a safe account.
 * The exception has no DB URL, username, password or tenant data.
 */
export function assertRuntimeDatabasePrincipal(
  row: DatabasePrincipalCapability | null | undefined,
): void {
  if (!row || row.is_superuser !== false ||
      row.can_bypass_rls !== false ||
      row.can_create_role !== false ||
      row.can_create_database !== false ||
      row.can_create_schema !== false ||
      row.can_create_in_database !== false ||
      row.can_set_privileged_role !== false ||
      row.can_bypass_tenant_rls_by_ownership !== false)
    throw new Error(DATABASE_APP_PRINCIPAL_DENIED);
}
