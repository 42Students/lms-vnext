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

test("flags application-readable tenant tables with unconditional permissive read policies", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "private_learners", can_select: true,
      unconditional_select_policy_count: 1, restrictive_select_policy_count: 0 },
    { ...base, table_name: "private_courses", can_select: true,
      unconditional_select_policy_count: 2, restrictive_select_policy_count: 0 },
  ]);
  assert.deepEqual(findings, [
    { severity: "CRITICAL", code: "APP_UNSCOPED_PERMISSIVE_SELECT", table: "private_learners" },
    { severity: "CRITICAL", code: "APP_UNSCOPED_PERMISSIVE_SELECT", table: "private_courses" },
  ]);
});

test("does not flag no SELECT grant or separately restrictive policy as a proven broad read", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "not_readable", can_select: false,
      unconditional_select_policy_count: 1, restrictive_select_policy_count: 0 },
    { ...base, table_name: "restrictively_scoped", can_select: true,
      unconditional_select_policy_count: 1, restrictive_select_policy_count: 1 },
    { ...base, table_name: "strictly_scoped", can_select: true,
      unconditional_select_policy_count: 0, restrictive_select_policy_count: 0 },
  ]);
  assert.deepEqual(findings, []);
});


test("reviews app-readable owner-rights and materialized views, but not invoker views", () => {
  const findings = classifySecurityCatalog(safePrincipal, [base], {
    views: [
      { schema_name: "public", view_name: "unsafe_default", relation_kind: "view",
        security_invoker: false, can_select: true },
      { schema_name: "public", view_name: "safe_invoker", relation_kind: "view",
        security_invoker: true, can_select: true },
      { schema_name: "public", view_name: "internal_owner_view", relation_kind: "view",
        security_invoker: false, can_select: false },
      { schema_name: "reporting", view_name: "private_rollup", relation_kind: "materialized_view",
        security_invoker: false, can_select: true },
    ],
  });
  assert.deepEqual(findings, [
    { severity: "HIGH", code: "APP_READABLE_OWNER_RIGHTS_VIEW_REQUIRES_REVIEW",
      table: "public.unsafe_default" },
    { severity: "HIGH", code: "APP_READABLE_MATERIALIZED_VIEW_REQUIRES_REVIEW",
      table: "reporting.private_rollup" },
  ]);
});

test("reviews executable SECURITY DEFINER routines without claiming every routine leaks", () => {
  const findings = classifySecurityCatalog(safePrincipal, [], {
    routines: [
      { routine_signature: "public.allowed_view()", security_definer: true, can_execute: true },
      { routine_signature: "public.private_admin()", security_definer: true, can_execute: false },
      { routine_signature: "public.safe_invoker()", security_definer: false, can_execute: true },
    ],
  });
  assert.deepEqual(findings, [
    { severity: "HIGH", code: "APP_EXECUTABLE_SECURITY_DEFINER_REQUIRES_REVIEW",
      table: "public.allowed_view()" },
  ]);
});
