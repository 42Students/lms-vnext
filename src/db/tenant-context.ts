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

/** One mutable holder per request: the actor resolver fills it in once, and every later query reads it. */
type Holder = { scope?: TenantScope; memo?: Map<string, unknown> };
const storage = new AsyncLocalStorage<Holder>();

export function currentTenantScope(): TenantScope | undefined {
  return storage.getStore()?.scope;
}

/**
 * Hand-off of one already-resolved value to the very next reader in this request. The wrapper resolves the actor
 * to check its permission and offers it here; the handler's first `getCurrentRequestContext()` takes it (no second
 * lookup, same instant), and every later call resolves fresh, so a handler that deliberately re-checks the actor
 * after slow work still sees any revocation. A no-op outside a request holder.
 */
export function offerRequestValue(key: string, value: unknown): void {
  const holder = storage.getStore();
  if (holder) (holder.memo ??= new Map()).set(key, value);
}

export function takeRequestValue<T>(key: string): T | undefined {
  const memo = storage.getStore()?.memo;
  if (!memo || !memo.has(key)) return undefined;
  const value = memo.get(key) as T;
  memo.delete(key);
  return value;
}

export function runWithTenantScope<T>(scope: TenantScope, fn: () => T): T {
  return storage.run({ scope }, fn);
}

/** Opens an empty per-request holder (the `secured()` wrapper does this for every API route). */
export function runWithTenantHolder<T>(fn: () => T): T {
  return storage.run({}, fn);
}

/**
 * Called by the actor resolver after it has authenticated the request. A no-op outside a request holder,
 * and it never replaces a scope that is already bound (a named system scope or a wrapper scope wins).
 */
export function bindTenantScope(scope: TenantScope): void {
  const holder = storage.getStore();
  if (holder && !holder.scope) holder.scope = scope;
}

/**
 * Called synchronously, in the caller's own context, BEFORE the actor is resolved. A server component or server
 * action has no wrapper holder; `enterWith` here (not after an await inside a callee, where it would not reach the
 * caller's continuation) gives it one, and `bindTenantScope` later fills it in. A no-op when a holder exists.
 */
export function ensureTenantHolder(): void {
  if (!storage.getStore()) storage.enterWith({});
}

/** For internal jobs and the session/membership bootstrap, which run before an actor exists. */
export function runAsSystem<T>(reason: string, fn: () => T): T {
  if (!reason.trim()) throw new Error("runAsSystem requires a reason.");
  return storage.run({ scope: { userId: null, collegeId: null, role: null, platform: false, system: reason } }, fn);
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
    // Defensive: a malformed context yields no role (and so no RLS access when enforced), never an exception.
    role: actor.membership?.roles?.[0] ?? (platform ? "SUPER_ADMIN" : null),
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
