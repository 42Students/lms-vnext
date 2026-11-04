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
    const tables = ["security_rls_guarded", "security_rls_unscoped", "security_rls_restrictive"];
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

      const appUrl = new URL(connection);
      appUrl.username = role;
      appUrl.password = password;
      const report = await auditPostgresSecurity(appUrl.toString());
      assert.equal(report.principal.runtime_user, role);
      assert.equal(report.principal.is_superuser, false);
      assert.equal(report.principal.can_bypass_rls, false);
      const relevant = report.tables.filter(row => tables.includes(row.table_name));
      assert.equal(relevant.length, 3);
      assert(relevant.every(row => row.rls_enabled && row.rls_forced && row.can_select));
      assert.deepEqual(
        report.findings.filter(f => tables.includes(f.table)).map(f => [f.code, f.table]),
        [["APP_UNSCOPED_PERMISSIVE_SELECT", "security_rls_unscoped"]],
      );

      const app = new Client({ connectionString: appUrl.toString() });
      await app.connect();
      try {
        // Defective policy allows an unrelated college's row; guarded policies
        // deny it. The audit must flag exactly the defective table.
        const leak = await app.query("SELECT value FROM public.security_rls_unscoped ORDER BY id");
        assert.deepEqual(leak.rows.map(row => row.value),
          ["college-a-data", "college-b-secret"]);
        const withoutTenant = await app.query("SELECT value FROM public.security_rls_guarded");
        assert.deepEqual(withoutTenant.rows, []);
        await app.query("BEGIN");
        await app.query("SELECT set_config('app.college_id',$1,true)", [collegeA]);
        const safe = await app.query("SELECT value FROM public.security_rls_guarded ORDER BY id");
        const restricted = await app.query("SELECT value FROM public.security_rls_restrictive ORDER BY id");
        assert.deepEqual(safe.rows.map(row => row.value), ["college-a-data"]);
        assert.deepEqual(restricted.rows.map(row => row.value), ["college-a-data"]);
        await app.query("ROLLBACK");
      } finally {
        await app.end();
      }
    } finally {
      try {
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
