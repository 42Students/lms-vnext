/**
 * Production must prove that college isolation is actually switched ON before it reports ready.
 *
 * Row-level security ships inert (`app.rls_mode` is not 'enforce' by default) and the per-request college setting is only applied
 * when DB_TENANT_SCOPE=on. If either is forgotten, every query silently sees every college. This policy turns that silent failure
 * into a failed readiness check, in the same place that already refuses an unsafe database role.
 *
 * Pure: the caller gathers the facts (environment and two catalog lookups) and passes them in.
 */
export const TENANT_ISOLATION_NOT_ENFORCED = "TENANT_ISOLATION_NOT_ENFORCED";

export type TenantReadinessFacts = {
  /** process.env.DB_TENANT_SCOPE */
  tenantScopeEnv: string | undefined;
  /** current_setting('app.rls_mode', true) as seen by the runtime connection, null when unset */
  rlsMode: string | null | undefined;
  /** whether the shared rate-limit store is switched on for this process */
  sharedStoreEnabled: boolean;
  /** to_regclass('public.security_shared_store') is not null */
  sharedStoreTablePresent: boolean;
};

/** Human-readable reasons readiness must fail. Never contains a value, a URL or a secret. */
export function tenantReadinessIssues(facts: TenantReadinessFacts): string[] {
  const issues: string[] = [];
  if (facts.tenantScopeEnv !== "on") {
    issues.push("DB_TENANT_SCOPE is not 'on': the per-request college setting is never applied");
  }
  if (facts.rlsMode !== "enforce") {
    issues.push("app.rls_mode is not 'enforce': row-level security policies allow every row");
  }
  if (facts.sharedStoreEnabled && !facts.sharedStoreTablePresent) {
    issues.push("the shared store is on but its table is missing: rate limits and webhook claims cannot be shared");
  }
  return issues;
}

export function assertTenantIsolationEnforced(facts: TenantReadinessFacts): void {
  const issues = tenantReadinessIssues(facts);
  if (issues.length === 0) return;
  // The code is the contract; the reasons are logged by the caller, never returned to a client.
  const error = new Error(TENANT_ISOLATION_NOT_ENFORCED);
  (error as Error & { issues: string[] }).issues = issues;
  throw error;
}
