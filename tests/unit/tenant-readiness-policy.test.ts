import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertTenantIsolationEnforced,
  TENANT_ISOLATION_NOT_ENFORCED,
  tenantReadinessIssues,
  type TenantReadinessFacts,
} from "@/db/tenant-readiness-policy";

const healthy: TenantReadinessFacts = {
  tenantScopeEnv: "on",
  rlsMode: "enforce",
  sharedStoreEnabled: true,
  sharedStoreTablePresent: true,
};

describe("production tenant readiness", () => {
  it("is satisfied only when scoping is on, enforcement is on and the shared table exists", () => {
    expect(tenantReadinessIssues(healthy)).toEqual([]);
    expect(() => assertTenantIsolationEnforced(healthy)).not.toThrow();
  });

  it("fails when the college setting is never applied", () => {
    for (const tenantScopeEnv of [undefined, "", "off", "ON", "true", "1"]) {
      expect(tenantReadinessIssues({ ...healthy, tenantScopeEnv }), String(tenantScopeEnv)).toHaveLength(1);
    }
  });

  it("fails when row-level security is inert or unset", () => {
    for (const rlsMode of [null, undefined, "", "off", "Enforce", "inert"]) {
      expect(tenantReadinessIssues({ ...healthy, rlsMode }), String(rlsMode)).toHaveLength(1);
    }
  });

  it("fails when the shared store is on but its table is missing, and ignores the table when the store is off", () => {
    expect(tenantReadinessIssues({ ...healthy, sharedStoreTablePresent: false })).toHaveLength(1);
    expect(tenantReadinessIssues({ ...healthy, sharedStoreEnabled: false, sharedStoreTablePresent: false })).toEqual([]);
  });

  it("reports every problem at once and throws the stable code with the reasons attached", () => {
    const facts: TenantReadinessFacts = { tenantScopeEnv: undefined, rlsMode: null, sharedStoreEnabled: true, sharedStoreTablePresent: false };
    expect(tenantReadinessIssues(facts)).toHaveLength(3);
    let caught: (Error & { issues?: string[] }) | null = null;
    try {
      assertTenantIsolationEnforced(facts);
    } catch (error) {
      caught = error as Error & { issues?: string[] };
    }
    expect(caught?.message).toBe(TENANT_ISOLATION_NOT_ENFORCED);
    expect(caught?.issues).toHaveLength(3);
  });

  it("never puts a value, URL or secret in a reason", () => {
    const facts: TenantReadinessFacts = { tenantScopeEnv: "postgres://user:secret@host/db", rlsMode: "token=abc", sharedStoreEnabled: false, sharedStoreTablePresent: false };
    expect(JSON.stringify(tenantReadinessIssues(facts))).not.toMatch(/postgres|secret|token|abc/);
  });

  it("the production readiness check in the database client uses it", () => {
    const client = readFileSync("src/db/client.ts", "utf8");
    expect(client).toContain("assertTenantIsolationEnforced(");
    expect(client).toContain("current_setting('app.rls_mode', true)");
    expect(client).toContain("public.security_shared_store");
  });
});
