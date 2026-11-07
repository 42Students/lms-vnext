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
  await client.query(`GRANT USAGE ON SCHEMA public TO rls_probe_user`);
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

  // 2b. Update/delete denial, row-move denial (SEC-06-008, 019 to 021) on the same probe table.
  await client.query(`GRANT UPDATE, DELETE ON rls_probe TO rls_probe_user`);
  const updOther = await asApp({ ...enforce, "app.college_id": A }, "UPDATE rls_probe SET college_id = college_id WHERE college_id = $1", [B]);
  check("enforce mode: college A cannot UPDATE a college B row", updOther.rowCount === 0);
  const delOther = await asApp({ ...enforce, "app.college_id": A }, "DELETE FROM rls_probe WHERE college_id = $1", [B]);
  check("enforce mode: college A cannot DELETE a college B row", delOther.rowCount === 0);
  let moveDenied = false;
  try {
    await asApp({ ...enforce, "app.college_id": A }, "UPDATE rls_probe SET college_id = $1 WHERE college_id = $2", [B, A]);
  } catch (error) {
    moveDenied = /row-level security/i.test(String(error.message));
  }
  check("enforce mode: college A cannot move its own row into college B", moveDenied);
  const delOwn = await asApp({ ...enforce, "app.college_id": A }, "DELETE FROM rls_probe WHERE college_id = $1", [A]);
  check("enforce mode: college A can delete its own rows", delOwn.rowCount >= 1);

  // 2c. Parent-derived policy (migration 0338): a child is visible exactly when its parent is.
  await client.query(`DROP TABLE IF EXISTS rls_probe_child`);
  await client.query(`CREATE TABLE rls_probe_child (id serial PRIMARY KEY, probe_id integer NOT NULL REFERENCES rls_probe(id))`);
  await client.query(`ALTER TABLE rls_probe_child ENABLE ROW LEVEL SECURITY`);
  const derived = `app_rls_bypass() OR EXISTS (SELECT 1 FROM "rls_probe" AS p WHERE p."id" = "rls_probe_child"."probe_id")`;
  await client.query(`CREATE POLICY tenant_isolation_derived ON rls_probe_child USING (${derived}) WITH CHECK (${derived})`);
  await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON rls_probe_child TO rls_probe_user`);
  await client.query(`GRANT USAGE ON SEQUENCE rls_probe_child_id_seq TO rls_probe_user`);
  const parents = (await client.query("SELECT id, college_id FROM rls_probe ORDER BY id")).rows;
  const pa = parents.find((r) => r.college_id === A)?.id;
  const pb = parents.find((r) => r.college_id === B)?.id;
  await client.query(`INSERT INTO rls_probe_child (probe_id) VALUES ($1), ($2)`, [pa, pb]);
  const countChild = async (s) => (await asApp(s, "SELECT count(*)::int AS n FROM rls_probe_child")).rows[0].n;
  check("derived, inert mode: all child rows", (await countChild({})) === 2);
  check("derived, enforce, no scope: no child rows", (await countChild(enforce)) === 0);
  check("derived, enforce, college A: only A's child rows", (await countChild({ ...enforce, "app.college_id": A })) === 1);
  check("derived, enforce, platform scope: all child rows", (await countChild({ ...enforce, "app.platform": "on" })) === 2);
  check("derived, enforce, system scope: all child rows", (await countChild({ ...enforce, "app.system": "job" })) === 2);
  const childDel = await asApp({ ...enforce, "app.college_id": A }, "DELETE FROM rls_probe_child WHERE probe_id = $1", [pb]);
  check("derived: college A cannot DELETE a college B child row", childDel.rowCount === 0);
  let childInsertDenied = false;
  try {
    await asApp({ ...enforce, "app.college_id": A }, "INSERT INTO rls_probe_child (probe_id) VALUES ($1)", [pb]);
  } catch (error) {
    childInsertDenied = /row-level security/i.test(String(error.message));
  }
  check("derived: college A cannot attach a child to a college B parent", childInsertDenied);

  // 2d. Catalog: every derived table in the plan is protected, no SECURITY DEFINER function exists in public.
  const { readFileSync } = await import("node:fs");
  const plan = JSON.parse(readFileSync("docs/security/assessments/derived-policy-plan.json", "utf8")).plan;
  const derivedCat = await client.query(
    `SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced,
            EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname AND p.policyname = 'tenant_isolation_derived') AS policy
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
     WHERE c.relkind = 'r' AND c.relname = ANY($1)`,
    [Object.keys(plan)],
  );
  const derivedBad = Object.keys(plan).filter((t) => !derivedCat.rows.some((r) => r.relname === t && r.rls && r.forced && r.policy));
  check(`all ${Object.keys(plan).length} parent-derived tables have RLS, FORCE and the derived policy`, derivedBad.length === 0, derivedBad.join(","));
  const forcedBad = (await client.query(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
     WHERE c.relkind = 'r' AND c.relname NOT LIKE 'rls_probe%' AND EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname AND p.policyname = 'tenant_isolation') AND NOT c.relforcerowsecurity`)).rows.map((r) => r.relname);
  check("every tenant_isolation table has FORCE ROW LEVEL SECURITY", forcedBad.length === 0, forcedBad.join(","));
  const definers = (await client.query(`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public' WHERE p.prosecdef`)).rows.map((r) => r.proname);
  check("no SECURITY DEFINER function in schema public (SEC-06-013/014)", definers.length === 0, definers.join(","));

  // 3. Global-read variant (migrations 0334 + 0336): platform-owned NULL-college rows are readable (SELECT only) by every
  //    college; update, delete and insert stay strict, so only a platform or system scope can change a global row.
  const variantTables = await client.query(
    `SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lms_groups','legacy_id_map')`);
  const policy = (table, name) => variantTables.rows.find((r) => r.tablename === table && r.policyname === name);
  check("lms_groups and legacy_id_map: strict tenant_isolation plus a SELECT-only global_read policy",
    ["lms_groups", "legacy_id_map"].every((t) => {
      const strict = policy(t, "tenant_isolation");
      const global = policy(t, "global_read");
      return strict && global && !/IS NULL/i.test(strict.qual) && !/IS NULL/i.test(strict.with_check ?? "") && global.cmd === "SELECT" && /IS NULL/i.test(global.qual);
    }));
  await client.query(`DROP TABLE IF EXISTS rls_probe_global`);
  await client.query(`CREATE TABLE rls_probe_global (id serial PRIMARY KEY, college_id uuid)`);
  await client.query(`ALTER TABLE rls_probe_global ENABLE ROW LEVEL SECURITY`);
  await client.query(`CREATE POLICY tenant_isolation ON rls_probe_global USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"))`);
  await client.query(`CREATE POLICY global_read ON rls_probe_global FOR SELECT USING ("college_id" IS NULL)`);
  await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON rls_probe_global TO rls_probe_user`);
  await client.query(`GRANT USAGE ON SEQUENCE rls_probe_global_id_seq TO rls_probe_user`);
  await client.query(`INSERT INTO rls_probe_global (college_id) VALUES ($1), ($2), (NULL)`, [A, B]);
  const countGlobal = async (s) => (await asApp(s, "SELECT count(*)::int AS n FROM rls_probe_global")).rows[0].n;
  check("variant, college A: own row plus the global row", (await countGlobal({ ...enforce, "app.college_id": A })) === 2);
  check("variant, platform scope: all rows", (await countGlobal({ ...enforce, "app.platform": "on" })) === 3);
  check("variant, inert mode: all rows", (await countGlobal({})) === 3);
  let globalDenied = false;
  try {
    await asApp({ ...enforce, "app.college_id": A }, "INSERT INTO rls_probe_global (college_id) VALUES (NULL)");
  } catch (error) {
    globalDenied = /row-level security/i.test(String(error.message));
  }
  check("variant: a college cannot insert a global row", globalDenied);
  const del = await asApp({ ...enforce, "app.college_id": A }, "DELETE FROM rls_probe_global WHERE college_id IS NULL");
  check("variant: a college cannot DELETE a global row", del.rowCount === 0);
  let takeover = false;
  try {
    const upd = await asApp({ ...enforce, "app.college_id": A }, "UPDATE rls_probe_global SET college_id = $1 WHERE college_id IS NULL", [A]);
    takeover = upd.rowCount === 0;
  } catch (error) {
    takeover = /row-level security/i.test(String(error.message));
  }
  check("variant: a college cannot take over a global row by UPDATE", takeover);
  const globalSystem = await asApp({ ...enforce, "app.system": "seed" }, "INSERT INTO rls_probe_global (college_id) VALUES (NULL) RETURNING id");
  check("variant: a system scope can write a global row", globalSystem.rowCount === 1);
} finally {
  await client.query("DROP TABLE IF EXISTS rls_probe_child").catch(() => {});
  await client.query("DROP TABLE IF EXISTS rls_probe_global").catch(() => {});
  await client.query("DROP TABLE IF EXISTS rls_probe").catch(() => {});
  await client.end();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("\nrls-tenant-acceptance: all checks passed");
