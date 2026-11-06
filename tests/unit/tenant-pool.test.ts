import { describe, expect, it } from "vitest";
import { runAsSystem, runWithTenantScope, scopeFromActor, tenantSettings, type TenantScope } from "@/db/tenant-context";
import { withTenantScope } from "@/db/tenant-pool";

type Call = { sql: string; values?: unknown[] };
function fakePool(opts: { failReset?: boolean } = {}) {
  const calls: Call[] = [];
  const released: Array<Error | boolean | undefined> = [];
  const client = {
    async query(q: unknown, values?: unknown[]) {
      const sql = typeof q === "string" ? q : (q as { text: string }).text;
      const v = typeof q === "string" ? values : (q as { values?: unknown[] }).values;
      calls.push({ sql, values: v });
      if (opts.failReset && sql.includes("''")) throw new Error("reset failed");
      return { rows: [] };
    },
    release(err?: Error | boolean) { released.push(err); },
  };
  const pool = {
    async connect() { return client; },
    async query(sql: string) { calls.push({ sql }); return { rows: [] }; },
  };
  return { pool: pool as never, calls, released };
}
const scope: TenantScope = { userId: "u1", collegeId: "c1", role: "STUDENT", platform: false, system: null };

describe("tenant-scoped pool", () => {
  it("is a no-op when disabled", async () => {
    const { pool, calls } = fakePool();
    const wrapped = withTenantScope(pool, false);
    await runWithTenantScope(scope, () => wrapped.query("select 1"));
    expect(calls.map((c) => c.sql)).toEqual(["select 1"]);
  });

  it("applies the scope before the query and resets before release", async () => {
    const { pool, calls, released } = fakePool();
    const wrapped = withTenantScope(pool, true);
    await runWithTenantScope(scope, () => wrapped.query("select 1"));
    await new Promise((r) => setTimeout(r, 0));
    const sql = calls.map((c) => c.sql);
    expect(sql[0]).toContain("set_config('app.college_id'");
    expect(calls[0]!.values).toContain("c1");
    expect(sql[1]).toBe("select 1");
    expect(sql[2]).toContain("set_config('app.college_id','',false)");
    expect(released).toEqual([undefined]);
  });

  it("does not touch the connection when there is no scope", async () => {
    const { pool, calls } = fakePool();
    const wrapped = withTenantScope(pool, true);
    await wrapped.query("select 1");
    expect(calls.map((c) => c.sql)).toEqual(["select 1"]);
  });

  it("destroys the connection if the reset fails", async () => {
    const { pool, released } = fakePool({ failReset: true });
    const wrapped = withTenantScope(pool, true);
    await runWithTenantScope(scope, () => wrapped.query("select 1"));
    await new Promise((r) => setTimeout(r, 0));
    expect(released[0]).toBeInstanceOf(Error);
  });

  it("keeps scopes separate between concurrent requests", async () => {
    const { pool, calls } = fakePool();
    const wrapped = withTenantScope(pool, true);
    await Promise.all([
      runWithTenantScope({ ...scope, collegeId: "A" }, () => wrapped.query("q1")),
      runWithTenantScope({ ...scope, collegeId: "B" }, () => wrapped.query("q2")),
    ]);
    const applied = calls.filter((c) => c.sql.includes("set_config('app.user_id', $1")).map((c) => c.values![1]);
    expect(applied.sort()).toEqual(["A", "B"]);
  });
});

describe("tenant context", () => {
  it("derives a college scope from a membership", () => {
    const s = scopeFromActor({ user: { id: "u", systemRoles: [] }, membership: { collegeId: "c", roles: ["TPO"] } });
    expect(s).toEqual({ userId: "u", collegeId: "c", role: "TPO", platform: false, system: null });
  });
  it("marks a Super Admin without a membership as platform", () => {
    const s = scopeFromActor({ user: { id: "u", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: { collegeId: "c2" } });
    expect(s.platform).toBe(true);
    expect(s.collegeId).toBe("c2");
  });
  it("does not let a Super Admin acting inside a college membership bypass it", () => {
    const s = scopeFromActor({ user: { id: "u", systemRoles: ["SUPER_ADMIN"] }, membership: { collegeId: "c", roles: ["COLLEGE_ADMIN"] } });
    expect(s.platform).toBe(false);
  });
  it("system scope needs a reason and uses empty identity", () => {
    expect(() => runAsSystem(" ", () => 1)).toThrow();
    expect(tenantSettings({ userId: null, collegeId: null, role: null, platform: false, system: "bootstrap" })["app.system"]).toBe("bootstrap");
  });
});
