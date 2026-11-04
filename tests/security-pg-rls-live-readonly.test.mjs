/**
 * Disposable PostgreSQL 17 witness for the RLS auditor. The unsafe policy is
 * intentionally created only inside a newly provisioned localhost test DB.
 * Never run against staging or production.
 */
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { auditPostgresSecurity } from "../scripts/security/pg-rls-readonly-audit.mjs";

const connection = process.env.TEST_DATABASE_URL;
const enabled = process.env.SECURITY_RLS_DISPOSABLE === "1" && Boolean(connection);
const role = "lms_security_catalog_app";
const password = "disposable-rls-fixture-only";
const collegeA = "11111111-1111-4111-8111-111111111111";
const collegeB = "22222222-2222-4222-8222-222222222222";

function requireDisposable() {
  if (!enabled) throw new Error("RLS_TEST_DISPOSABLE_FLAG_REQUIRED");
  const target = new URL(connection);
  if (!["127.0.0.1", "localhost"].includes(target.hostname) ||
      target.pathname !== "/lms_vnext_rls_test" ||
      !["postgres:", "postgresql:"].includes(target.protocol)) {
    throw new Error("RLS_TEST_REFUSED_NON_LOCAL_DATABASE");
  }
}

test("restricted app principal and live SQL identify an unconditional tenant-leaking SELECT policy",
  { skip: !enabled }, async () => {
    requireDisposable();
    const { Client } = pg;
    const admin = new Client({ connectionString: connection });
    await admin.connect();
    const tables = ["security_rls_guarded", "security_rls_unscoped", "security_rls_restrictive",
      "security_rls_noop_restrictive"];
    const views = ["security_rls_definer_view", "security_rls_invoker_view",
      "security_rls_materialized"];
    try {
      await admin.query("CREATE ROLE " + role +
        " LOGIN PASSWORD '" + password + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
      await admin.query("GRANT USAGE ON SCHEMA public TO " + role);
      for (const table of tables) {
        await admin.query("CREATE TABLE public." + table +
          " (id bigint PRIMARY KEY, college_id uuid NOT NULL, value text NOT NULL)");
        await admin.query("INSERT INTO public." + table +
          "(id,college_id,value) VALUES (1,$1,'college-a-data'),(2,$2,'college-b-secret')",
          [collegeA, collegeB]);
        await admin.query("ALTER TABLE public." + table + " ENABLE ROW LEVEL SECURITY");
        await admin.query("ALTER TABLE public." + table + " FORCE ROW LEVEL SECURITY");
        await admin.query("GRANT SELECT ON public." + table + " TO " + role);
      }
      const scoped = "(college_id = nullif(current_setting('app.college_id', true),'')::uuid)";
      await admin.query("CREATE POLICY scoped_select ON public.security_rls_guarded FOR SELECT TO " +
        role + " USING " + scoped);
      await admin.query("CREATE POLICY overly_broad_select ON public.security_rls_unscoped " +
        "FOR SELECT TO PUBLIC USING (true)");
      await admin.query("CREATE POLICY broad_select ON public.security_rls_restrictive " +
        "FOR SELECT TO PUBLIC USING (true)");
      await admin.query("CREATE POLICY tenant_restriction ON public.security_rls_restrictive " +
        "AS RESTRICTIVE FOR SELECT TO " + role + " USING " + scoped);

      await admin.query("CREATE POLICY broad_select ON public.security_rls_noop_restrictive " +
        "FOR SELECT TO PUBLIC USING (true)");
      await admin.query("CREATE POLICY noop_restriction ON public.security_rls_noop_restrictive " +
        "AS RESTRICTIVE FOR SELECT TO " + role + " USING (true)");

      // A view owned by the admin login uses that login's privileges by
      // default, bypassing even correctly configured underlying table RLS.
      // PostgreSQL 15+ security_invoker views instead honor the app login.
      await admin.query("CREATE VIEW public.security_rls_definer_view AS " +
        "SELECT id, college_id, value FROM public.security_rls_guarded");
      await admin.query("CREATE VIEW public.security_rls_invoker_view " +
        "WITH (security_invoker = true) AS " +
        "SELECT id, college_id, value FROM public.security_rls_guarded");
      await admin.query("CREATE MATERIALIZED VIEW public.security_rls_materialized AS " +
        "SELECT id, college_id, value FROM public.security_rls_guarded");
      for (const view of views) {
        await admin.query("GRANT SELECT ON public." + view + " TO " + role);
      }
      await admin.query("CREATE FUNCTION public.security_rls_definer_rows() " +
        "RETURNS TABLE(value text) LANGUAGE sql SECURITY DEFINER AS " +
        "'SELECT t.value FROM public.security_rls_guarded AS t ORDER BY t.id'");
      await admin.query("GRANT EXECUTE ON FUNCTION public.security_rls_definer_rows() TO " + role);

      const appUrl = new URL(connection);
      appUrl.username = role;
      appUrl.password = password;
      const report = await auditPostgresSecurity(appUrl.toString());
      assert.equal(report.principal.runtime_user, role);
      assert.equal(report.principal.is_superuser, false);
      assert.equal(report.principal.can_bypass_rls, false);
      const relevant = report.tables.filter(row => tables.includes(row.table_name));
      assert.equal(relevant.length, 4);
      assert.equal(report.summary.accessible_views, 3);
      assert.equal(report.summary.accessible_security_definer_routines, 1);
      assert.deepEqual(report.findings.filter(f => views.some(v => f.table?.endsWith("." + v)))
        .map(f => [f.code, f.table]), [
          ["APP_READABLE_OWNER_RIGHTS_VIEW_REQUIRES_REVIEW", "public.security_rls_definer_view"],
          ["APP_READABLE_MATERIALIZED_VIEW_REQUIRES_REVIEW", "public.security_rls_materialized"],
        ]);
      assert(report.findings.some(f =>
        f.code === "APP_EXECUTABLE_SECURITY_DEFINER_REQUIRES_REVIEW" &&
        f.table === "security_rls_definer_rows()"));
      assert(relevant.every(row => row.rls_enabled && row.rls_forced && row.can_select));
      assert.deepEqual(
        report.findings.filter(f => tables.some(t => f.table === "public." + t)).map(f => [f.code, f.table]),
        [
          ["APP_UNSCOPED_PERMISSIVE_SELECT", "public.security_rls_noop_restrictive"],
          ["APP_UNSCOPED_PERMISSIVE_SELECT", "public.security_rls_unscoped"],
        ],
      );

      const app = new Client({ connectionString: appUrl.toString() });
      await app.connect();
      try {
        // Defective policy allows an unrelated college's row; guarded policies
        // deny it. The audit must flag exactly the defective table.
        const leak = await app.query("SELECT value FROM public.security_rls_unscoped ORDER BY id");
        assert.deepEqual(leak.rows.map(row => row.value),
          ["college-a-data", "college-b-secret"]);
        const noOp = await app.query("SELECT value FROM public.security_rls_noop_restrictive ORDER BY id");
        assert.deepEqual(noOp.rows.map(row => row.value),
          ["college-a-data", "college-b-secret"]);
        const withoutTenant = await app.query("SELECT value FROM public.security_rls_guarded");
        assert.deepEqual(withoutTenant.rows, []);
        const ownerView = await app.query(
          "SELECT value FROM public.security_rls_definer_view ORDER BY id");
        assert.deepEqual(ownerView.rows.map(row => row.value),
          ["college-a-data", "college-b-secret"]);
        const materialized = await app.query(
          "SELECT value FROM public.security_rls_materialized ORDER BY id");
        assert.deepEqual(materialized.rows.map(row => row.value),
          ["college-a-data", "college-b-secret"]);
        const definerFunction = await app.query(
          "SELECT value FROM public.security_rls_definer_rows()");
        assert.deepEqual(definerFunction.rows.map(row => row.value),
          ["college-a-data", "college-b-secret"]);
        const invokerWithoutTenant = await app.query(
          "SELECT value FROM public.security_rls_invoker_view");
        assert.deepEqual(invokerWithoutTenant.rows, []);
        await app.query("BEGIN");
        await app.query("SELECT set_config('app.college_id',$1,true)", [collegeA]);
        const safe = await app.query("SELECT value FROM public.security_rls_guarded ORDER BY id");
        const invokerWithTenant = await app.query(
          "SELECT value FROM public.security_rls_invoker_view ORDER BY id");
        assert.deepEqual(invokerWithTenant.rows.map(row => row.value), ["college-a-data"]);
        const restricted = await app.query("SELECT value FROM public.security_rls_restrictive ORDER BY id");
        assert.deepEqual(safe.rows.map(row => row.value), ["college-a-data"]);
        assert.deepEqual(restricted.rows.map(row => row.value), ["college-a-data"]);
        await app.query("ROLLBACK");
      } finally {
        await app.end();
      }
    } finally {
      try {
        await admin.query("DROP FUNCTION IF EXISTS public.security_rls_definer_rows()");
        for (const view of [...views].reverse()) {
          await admin.query("DROP " + (view === "security_rls_materialized" ?
            "MATERIALIZED VIEW" : "VIEW") + " IF EXISTS public." + view);
        }
        for (const table of [...tables].reverse()) {
          await admin.query("DROP TABLE IF EXISTS public." + table + " CASCADE");
        }
        // The temporary role also holds an explicit schema USAGE grant.
        // Revoke it before dropping the role and assert cleanup succeeds.
        await admin.query("REVOKE USAGE ON SCHEMA public FROM " + role);
        await admin.query("DROP ROLE IF EXISTS " + role);
      } finally {
        await admin.end();
      }
    }
  });

test("non-inherited SET ROLE into an owner/BYPASSRLS role is a critical tenant boundary",
  { skip: !enabled }, async () => {
    requireDisposable();
    const owner = "lms_security_catalog_escalation_owner";
    const login = "lms_security_catalog_escalation_login";
    const table = "security_rls_escalation_fixture";
    const admin = new pg.Client({ connectionString: connection });
    let app;
    await admin.connect();
    try {
      await admin.query("CREATE ROLE " + owner +
        " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS NOREPLICATION");
      await admin.query("CREATE ROLE " + login +
        " LOGIN PASSWORD 'disposable-set-role-only' NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
      await admin.query("GRANT USAGE ON SCHEMA public TO " + owner);
      await admin.query("GRANT USAGE ON SCHEMA public TO " + login);
      await admin.query("CREATE TABLE public." + table +
        " (id integer PRIMARY KEY, college_id uuid NOT NULL, value text NOT NULL)");
      await admin.query("INSERT INTO public." + table +
        " (id,college_id,value) VALUES (1,$1,'college-a'),(2,$2,'college-b')",
        [collegeA, collegeB]);
      await admin.query("ALTER TABLE public." + table + " ENABLE ROW LEVEL SECURITY");
      // Deliberately no FORCE RLS: the owner role can bypass RLS.
      await admin.query("ALTER TABLE public." + table + " OWNER TO " + owner);
      await admin.query("GRANT " + owner + " TO " + login + " WITH INHERIT FALSE, SET TRUE");

      const appUrl = new URL(connection);
      appUrl.username = login;
      appUrl.password = "disposable-set-role-only";
      const report = await auditPostgresSecurity(appUrl.toString());
      assert.equal(report.principal.runtime_user, login);
      assert.equal(report.principal.is_superuser, false);
      assert.equal(report.principal.can_bypass_rls, false);
      assert.equal(report.principal.can_set_privileged_role, true);
      assert.equal(report.principal.can_bypass_tenant_rls_by_ownership, true);
      assert.equal(report.principal.can_truncate_tenant_tables, true);
      for (const code of ["APP_CAN_SET_PRIVILEGED_DB_ROLE",
        "APP_ROLE_CAN_BYPASS_TENANT_RLS_BY_OWNERSHIP",
        "APP_ROLE_CAN_TRUNCATE_TENANT_TABLES"]) {
        assert(report.findings.some(f => f.code === code && f.severity === "CRITICAL"), code);
      }

      app = new pg.Client({ connectionString: appUrl.toString() });
      await app.connect();
      await assert.rejects(app.query("SELECT value FROM public." + table),
        error => error.code === "42501");
      await app.query("SET ROLE " + owner);
      const exposed = await app.query("SELECT value FROM public." + table + " ORDER BY id");
      assert.deepEqual(exposed.rows.map(row => row.value), ["college-a", "college-b"]);
      await app.query("RESET ROLE");
    } finally {
      if (app) await app.end();
      try {
        await admin.query("DROP TABLE IF EXISTS public." + table + " CASCADE");
        await admin.query("REVOKE " + owner + " FROM " + login).catch(() => {});
        await admin.query("REVOKE USAGE ON SCHEMA public FROM " + owner).catch(() => {});
        await admin.query("REVOKE USAGE ON SCHEMA public FROM " + login).catch(() => {});
        await admin.query("DROP ROLE IF EXISTS " + login);
        await admin.query("DROP ROLE IF EXISTS " + owner);
      } finally {
        await admin.end();
      }
    }
  });
