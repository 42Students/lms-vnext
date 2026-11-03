import test from "node:test";
import assert from "node:assert/strict";
import { classifySecurityCatalog } from "../scripts/security/pg-rls-readonly-audit.mjs";

const safePrincipal = {
  is_superuser: false,
  can_bypass_rls: false,
  can_create_role: false,
  can_create_database: false,
  can_create_schema: false,
  can_create_in_database: false,
};
const base = {
  table_name: "course_offerings",
  tenant_key_columns: ["college_id"],
  rls_enabled: true,
  rls_forced: true,
  is_effective_owner: false,
  policy_count: 2,
};

test("reports unguarded direct tenant-key table even when other tables have policies", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    base,
    { ...base, table_name: "course_assignments", rls_enabled: false, policy_count: 0 },
    { ...base, table_name: "placements", rls_enabled: true, policy_count: 0 },
  ]);
  assert.deepEqual(findings, [
    { severity: "HIGH", code: "TENANT_KEY_TABLE_NO_RLS", table: "course_assignments" },
    { severity: "HIGH", code: "TENANT_KEY_TABLE_NO_POLICY", table: "placements" },
  ]);
});

test("rejects a privileged application principal and RLS-owner bypass", () => {
  const findings = classifySecurityCatalog(
    { ...safePrincipal, is_superuser: true, can_bypass_rls: true,
      can_create_role: true, can_create_database: true },
    [{ ...base, table_name: "college_memberships", is_effective_owner: true, rls_forced: false }],
  );
  assert.deepEqual(findings.map(f => f.code), [
    "PRIVILEGED_APP_DB_ROLE",
    "APP_DB_ROLE_CAN_CREATE",
    "APP_OWNS_TABLE_WITHOUT_FORCE_RLS",
  ]);
});

test("does not pretend a table with indirect tenant lineage is certified", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "lesson_contents", tenant_key_columns: [], rls_enabled: false },
  ]);
  // Caller must separately review every indirect tenant lineage table.
  assert.deepEqual(findings, []);
  assert.deepEqual(classifySecurityCatalog(safePrincipal, [base]), []);
});
