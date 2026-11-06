import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped database identity (docs/security/central-security-architecture.md, layer L5).
 *
 * The route wrapper puts the resolved actor here once; the pool wrapper in `tenant-pool.ts` copies it onto
 * every database connection as `app.*` settings, which the row-level-security policies read. Nothing in a
 * handler can widen it: there is no setter other than `runWithTenantScope` / `runAsSystem`.
 */
export type TenantScope = {
  userId: string | null;
  collegeId: string | null;
  role: string | null;
  /** Super Admin working across colleges. */
  platform: boolean;
  /** Set only by `runAsSystem`: a named, reviewed internal job or bootstrap read. */
  system: string | null;
};

const storage = new AsyncLocalStorage<TenantScope>();

export function currentTenantScope(): TenantScope | undefined {
  return storage.getStore();
}

export function runWithTenantScope<T>(scope: TenantScope, fn: () => T): T {
  return storage.run(scope, fn);
}

/** For internal jobs and the session/membership bootstrap, which run before an actor exists. */
export function runAsSystem<T>(reason: string, fn: () => T): T {
  if (!reason.trim()) throw new Error("runAsSystem requires a reason.");
  return storage.run({ userId: null, collegeId: null, role: null, platform: false, system: reason }, fn);
}

type ActorLike = {
  user: { id: string; systemRoles?: readonly string[] };
  membership?: { collegeId: string; roles: readonly string[] } | null;
  adminScope?: { collegeId: string | null } | null;
};

export function scopeFromActor(actor: ActorLike): TenantScope {
  const platform = Boolean(actor.user.systemRoles?.includes("SUPER_ADMIN")) && !actor.membership;
  return {
    userId: actor.user.id,
    collegeId: actor.membership?.collegeId ?? actor.adminScope?.collegeId ?? null,
    role: actor.membership?.roles[0] ?? (platform ? "SUPER_ADMIN" : null),
    platform,
    system: null,
  };
}

/** The settings applied to a connection. Empty strings (not NULL) so `current_setting(..., true)` is uniform. */
export function tenantSettings(scope: TenantScope | undefined): Record<string, string> {
  return {
    "app.user_id": scope?.userId ?? "",
    "app.college_id": scope?.collegeId ?? "",
    "app.role": scope?.role ?? "",
    "app.platform": scope?.platform ? "on" : "",
    "app.system": scope?.system ?? "",
  };
}

export const RESET_TENANT_SETTINGS_SQL =
  "SELECT set_config('app.user_id','',false), set_config('app.college_id','',false), set_config('app.role','',false), set_config('app.platform','',false), set_config('app.system','',false)";

export function applyTenantSettingsQuery(scope: TenantScope | undefined): { text: string; values: string[] } {
  const settings = tenantSettings(scope);
  const keys = Object.keys(settings);
  return {
    text: "SELECT " + keys.map((k, i) => `set_config('${k}', $${i + 1}, false)`).join(", "),
    values: keys.map((k) => settings[k]!),
  };
}
