#!/usr/bin/env node
// Executed acceptance for tenant row-level security on a DISPOSABLE PostgreSQL (TEST_DATABASE_URL only).
// Proves, with a non-superuser role (superusers bypass RLS): inert mode, enforce mode, cross-college
// denial, write denial, platform/system scopes, and that every college_id table has RLS + the policy.
import pg from "pg";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required (disposable database only).");
const host = new URL(url).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error(`refusing non-local database host ${host}`);

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const client = new pg.Client({ connectionString: url });
await client.connect();
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
  if (!ok) failures.push(name);
};

try {
  // 1. Catalog: every college_id table has RLS enabled and the tenant policy.
  const cat = await client.query(`
    SELECT c.relname, c.relrowsecurity AS rls,
           EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname AND p.policyname = 'tenant_isolation') AS policy
    FROM information_schema.columns col
    JOIN pg_class c ON c.relname = col.table_name AND c.relkind = 'r'
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE col.table_schema = 'public' AND col.column_name = 'college_id' AND col.table_name <> 'rls_probe'`);
  const bad = cat.rows.filter((r) => !r.rls || !r.policy).map((r) => r.relname);
  check(`all ${cat.rowCount} tenant tables have RLS enabled and the tenant_isolation policy`, cat.rowCount > 0 && bad.length === 0, bad.join(","));

  // 2. Behaviour on a probe table that uses the same policy text.
  await client.query(`DROP TABLE IF EXISTS rls_probe`);
  await client.query(`CREATE TABLE rls_probe (id serial PRIMARY KEY, college_id uuid NOT NULL)`);
  await client.query(`ALTER TABLE rls_probe ENABLE ROW LEVEL SECURITY`);
  await client.query(`CREATE POLICY tenant_isolation ON rls_probe USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"))`);
  await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_probe_user') THEN CREATE ROLE rls_probe_user NOLOGIN; END IF; END $$`);
  await client.query(`GRANT SELECT, INSERT ON rls_probe TO rls_probe_user`);
  await client.query(`GRANT USAGE ON SEQUENCE rls_probe_id_seq TO rls_probe_user`);
  await client.query(`INSERT INTO rls_probe (college_id) VALUES ($1), ($2)`, [A, B]);

  async function asApp(settings, sql, params = []) {
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL ROLE rls_probe_user");
      for (const [k, v] of Object.entries(settings)) await client.query("SELECT set_config($1, $2, true)", [k, v]);
      return await client.query(sql, params);
    } finally {
      await client.query("ROLLBACK");
    }
  }
  const count = async (s) => (await asApp(s, "SELECT count(*)::int AS n FROM rls_probe")).rows[0].n;

  check("inert mode (no app.rls_mode): policies allow all rows", (await count({})) === 2);
  const enforce = { "app.rls_mode": "enforce" };
  check("enforce mode, no scope: no rows visible", (await count(enforce)) === 0);
  check("enforce mode, college A: only A rows", (await count({ ...enforce, "app.college_id": A })) === 1);
  check("enforce mode, college B: only B rows", (await count({ ...enforce, "app.college_id": B })) === 1);
  check("enforce mode, platform scope: all rows", (await count({ ...enforce, "app.platform": "on" })) === 2);
  check("enforce mode, named system scope: all rows", (await count({ ...enforce, "app.system": "bootstrap" })) === 2);

  let denied = false;
  try {
    await asApp({ ...enforce, "app.college_id": A }, "INSERT INTO rls_probe (college_id) VALUES ($1)", [B]);
  } catch (error) {
    denied = /row-level security/i.test(String(error.message));
  }
  check("enforce mode: college A cannot write a college B row", denied);
  const own = await asApp({ ...enforce, "app.college_id": A }, "INSERT INTO rls_probe (college_id) VALUES ($1) RETURNING id", [A]);
  check("enforce mode: college A can write its own row", own.rowCount === 1);
} finally {
  await client.query("DROP TABLE IF EXISTS rls_probe").catch(() => {});
  await client.end();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("\nrls-tenant-acceptance: all checks passed");
