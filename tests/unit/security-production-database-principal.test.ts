import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {assertRuntimeDatabasePrincipal,DATABASE_APP_PRINCIPAL_DENIED,enforceProductionDatabasePrincipal,
 type DatabasePrincipalCapability} from "@/db/runtime-principal-policy";

const safe:DatabasePrincipalCapability={
 is_superuser:false,can_bypass_rls:false,can_create_role:false,
 can_create_database:false,can_create_schema:false,can_create_in_database:false,
 can_set_privileged_role:false,can_bypass_tenant_rls_by_ownership:false,
 can_truncate_tenant_tables:false,
};
describe("production PostgreSQL app role readiness",()=>{
 it("requires explicit production deployment, not merely Next.js build mode",()=>{
  expect(enforceProductionDatabasePrincipal({nodeEnv:"production",appEnv:"production"})).toBe(true);
  expect(enforceProductionDatabasePrincipal({nodeEnv:"production",appEnv:"staging"})).toBe(false);
  expect(enforceProductionDatabasePrincipal({nodeEnv:"test",appEnv:"production"})).toBe(false);
 });
 it("allows positively attested unprivileged role",()=>{
  expect(()=>assertRuntimeDatabasePrincipal(safe)).not.toThrow();
 });
 it.each(Object.keys(safe) as (keyof DatabasePrincipalCapability)[])
  ("rejects %s when true, missing or unknown",key=>{
    for(const state of [true,null,undefined])
      expect(()=>assertRuntimeDatabasePrincipal({...safe,[key]:state}))
        .toThrow(DATABASE_APP_PRINCIPAL_DENIED);
  });
 it("rejects absent catalog row or incomplete role",()=>{
  for(const row of [null,undefined,{} as DatabasePrincipalCapability])
   expect(()=>assertRuntimeDatabasePrincipal(row)).toThrow(DATABASE_APP_PRINCIPAL_DENIED);
 });
 it("runs actual database current_user privilege checks before readiness schema",()=>{
  const s=readFileSync("src/db/client.ts","utf8");
  const fn=s.slice(s.indexOf("export async function checkDatabaseConnection()"));
  const check=fn.indexOf("assertRuntimeDatabasePrincipal(principal.rows[0])");
  expect(check).toBeGreaterThan(0);
  expect(check).toBeLessThan(fn.indexOf("const result = await client.query"));
  expect(fn).toContain("WHERE r.rolname = current_user");
  expect(fn).toContain("has_schema_privilege(current_user");
  expect(fn).toContain("has_database_privilege(current_user");
  expect(fn).toContain("pg_has_role(session_user, elevated.oid, 'SET')");
  expect(fn).toContain("AS can_bypass_tenant_rls_by_ownership");
  expect(fn).toContain("AS can_truncate_tenant_tables");
 });
});
