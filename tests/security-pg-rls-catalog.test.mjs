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
  can_set_privileged_role: false,
  can_bypass_tenant_rls_by_ownership: false,
  can_truncate_tenant_tables: false,
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


test("keeps schema-qualified identity for protected tables outside public", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, schema_name: "tenant_archive", table_name: "learner_records",
      rls_enabled: false },
  ]);
  assert.deepEqual(findings, [
    { severity: "HIGH", code: "TENANT_KEY_TABLE_NO_RLS",
      table: "tenant_archive.learner_records" },
  ]);
});


test("flags cross-tenant INSERT when new-row WITH CHECK is unconditionally permissive", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "college_enrollments", can_insert: true,
      unconditional_insert_check_policy_count: 1, restrictive_insert_check_policy_count: 0 },
    { ...base, table_name: "other_college", can_insert: true,
      unconditional_insert_check_policy_count: 2, restrictive_insert_check_policy_count: 0 },
  ]);
  assert.deepEqual(findings.map(f => [f.code, f.table]), [
    ["APP_UNSCOPED_PERMISSIVE_INSERT", "college_enrollments"],
    ["APP_UNSCOPED_PERMISSIVE_INSERT", "other_college"],
  ]);
});

test("flags broad UPDATE USING and WITH CHECK separately: old and new rows need independent isolation", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "can_edit_other_colleges", can_update: true,
      unconditional_update_using_policy_count: 1, restrictive_update_using_policy_count: 0,
      unconditional_update_check_policy_count: 0, restrictive_update_check_policy_count: 1 },
    { ...base, table_name: "can_move_rows_to_other_college", can_update: true,
      unconditional_update_using_policy_count: 0, restrictive_update_using_policy_count: 1,
      unconditional_update_check_policy_count: 1, restrictive_update_check_policy_count: 0 },
    { ...base, table_name: "unbounded_both_directions", can_update: true,
      unconditional_update_using_policy_count: 1, restrictive_update_using_policy_count: 0,
      unconditional_update_check_policy_count: 1, restrictive_update_check_policy_count: 0 },
  ]);
  assert.deepEqual(findings.map(f => [f.code, f.table]), [
    ["APP_UNSCOPED_PERMISSIVE_UPDATE_USING", "can_edit_other_colleges"],
    ["APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK", "can_move_rows_to_other_college"],
    ["APP_UNSCOPED_PERMISSIVE_UPDATE_USING", "unbounded_both_directions"],
    ["APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK", "unbounded_both_directions"],
  ]);
});

test("flags unscoped DELETE with a real runtime role grant, not an unrelated policy", () => {
  assert.deepEqual(classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "college_students", can_delete: true,
      unconditional_delete_using_policy_count: 1, restrictive_delete_using_policy_count: 0 },
  ]).map(f => f.code), ["APP_UNSCOPED_PERMISSIVE_DELETE"]);
  assert.deepEqual(classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "college_students", can_delete: false,
      unconditional_delete_using_policy_count: 1, restrictive_delete_using_policy_count: 0 },
  ]), []);
});

test("does not mistake substantive RESTRICTIVE policies, no direct grants or scoped writes for broad writes", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "no_insert_grant", can_insert: false,
      unconditional_insert_check_policy_count: 1, restrictive_insert_check_policy_count: 0 },
    { ...base, table_name: "insert_with_restriction", can_insert: true,
      unconditional_insert_check_policy_count: 1, restrictive_insert_check_policy_count: 1 },
    { ...base, table_name: "update_restricted_both", can_update: true,
      unconditional_update_using_policy_count: 1, restrictive_update_using_policy_count: 1,
      unconditional_update_check_policy_count: 1, restrictive_update_check_policy_count: 1 },
    { ...base, table_name: "delete_restricted", can_delete: true,
      unconditional_delete_using_policy_count: 1, restrictive_delete_using_policy_count: 1 },
    { ...base, table_name: "scoped_writes", can_insert: true, can_update: true, can_delete: true,
      unconditional_insert_check_policy_count: 0, restrictive_insert_check_policy_count: 0,
      unconditional_update_using_policy_count: 0, restrictive_update_using_policy_count: 0,
      unconditional_update_check_policy_count: 0, restrictive_update_check_policy_count: 0,
      unconditional_delete_using_policy_count: 0, restrictive_delete_using_policy_count: 0 },
  ]);
  assert.deepEqual(findings, []);
});

test("no-op restrictive CHECK(true) must not mask an unsafe permissive INSERT/UPDATE", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, can_insert: true, can_update: true,
      unconditional_insert_check_policy_count: 1, restrictive_insert_check_policy_count: 0,
      unconditional_update_using_policy_count: 1, restrictive_update_using_policy_count: 0,
      unconditional_update_check_policy_count: 1, restrictive_update_check_policy_count: 0 },
  ]);
  assert.deepEqual(findings.map(f => f.code), [
    "APP_UNSCOPED_PERMISSIVE_INSERT",
    "APP_UNSCOPED_PERMISSIVE_UPDATE_USING",
    "APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK",
  ]);
});

test("direct tenant TRUNCATE is critical even if SELECT/UPDATE/DELETE policies are perfectly scoped", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "tenant_grades", can_truncate: true,
      can_select: true, can_update: true, can_delete: true },
  ]);
  assert.deepEqual(findings, [
    { severity: "CRITICAL", code: "APP_CAN_TRUNCATE_TENANT_TABLE", table: "tenant_grades" },
  ]);
  const readOnly = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "tenant_grades", can_truncate: false },
  ]);
  assert.deepEqual(readOnly, []);
});

test("TRUNCATE must be flagged even when RLS is entirely disabled", () => {
  const findings = classifySecurityCatalog(safePrincipal, [
    { ...base, table_name: "unprotected_tenant", rls_enabled: false, can_truncate: true },
  ]);
  assert.deepEqual(findings.map(f=>f.code), [
    "APP_CAN_TRUNCATE_TENANT_TABLE", "TENANT_KEY_TABLE_NO_RLS",
  ]);
});

test("flags SET ROLE paths that bypass a restricted initial database login", () => {
  const capabilities = [
    ["can_set_privileged_role", "APP_CAN_SET_PRIVILEGED_DB_ROLE"],
    ["can_bypass_tenant_rls_by_ownership", "APP_ROLE_CAN_BYPASS_TENANT_RLS_BY_OWNERSHIP"],
    ["can_truncate_tenant_tables", "APP_ROLE_CAN_TRUNCATE_TENANT_TABLES"],
  ];
  for (const [capability, code] of capabilities) {
    const findings = classifySecurityCatalog({ ...safePrincipal, [capability]: true }, []);
    assert.deepEqual(findings.map(f => [f.severity, f.code, f.table]),
      [["CRITICAL", code, null]], capability);
  }
  assert.deepEqual(classifySecurityCatalog(safePrincipal, []), []);
});

