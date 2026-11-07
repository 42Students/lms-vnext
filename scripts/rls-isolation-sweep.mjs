#!/usr/bin/env node
// Isolation sweep over EVERY table that has a tenant policy (SEC-05-005/006/008, SEC-06-004/019).
// Under the real runtime role with app.rls_mode=enforce it checks, inside rolled-back work only, that for each
// policied table: no scope sees no rows; college A and college B see disjoint row sets; and (tables with
// college_id) neither sees rows stamped with the other college. It also checks the identity-core behaviour:
// the workspace picker (own colleges), users and organizations narrowing.
//
//   DATABASE_URL=... SWEEP_ALLOW_DEV=1 node scripts/rls-isolation-sweep.mjs [--apply=a.sql,b.sql] [collegeA collegeB]
//
// --apply=files runs the given migration files first in ONE transaction that is always rolled back, so the
// migrations can be proven on real data before they are applied. Dev or disposable databases only.
import pg from "pg";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (runtime role) is required");
const local = ["127.0.0.1", "localhost", "::1"].includes(new URL(url).hostname);
if (!local && process.env.SWEEP_ALLOW_DEV !== "1") throw new Error("non-local database: set SWEEP_ALLOW_DEV=1 (dev only, never production)");
const argv = process.argv.slice(2);
const applyArg = argv.find((a) => a.startsWith("--apply="));
const positional = argv.filter((a) => !a.startsWith("--"));

const client = new pg.Client({ connectionString: url });
await client.connect();
const failures = [];
const passes = [];
const check = (name, ok, detail = "") => (ok ? passes.push(name) : failures.push(`${name}${detail ? ": " + detail : ""}`));

let sp = 0;
async function scoped(settings, fn) {
  const name = `sweep_${++sp}`;
  await client.query(`SAVEPOINT ${name}`);
  try {
    for (const [k, v] of Object.entries({ "app.rls_mode": "enforce", ...settings })) await client.query("SELECT set_config($1, $2, true)", [k, v]);
    return await fn();
  } finally {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    await client.query(`RELEASE SAVEPOINT ${name}`);
  }
}
const q = async (settings, sql, params = []) => scoped(settings, async () => (await client.query(sql, params)).rows);
const count = async (settings, sql, params = []) => Number((await q(settings, sql, params))[0].n);

await client.query("BEGIN");
try {
  if (applyArg) {
    for (const file of applyArg.slice("--apply=".length).split(",").filter(Boolean)) {
      const parts = readFileSync(file, "utf8").split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
      for (const part of parts) await client.query(part);
      console.log(`applied (to be rolled back): ${file} (${parts.length} statements)`);
    }
  }
  const SYS = { "app.system": "isolation-sweep" };
  let [A, B] = positional;
  if (!A || !B) {
    const rows = await q(SYS, "SELECT college_id FROM college_memberships GROUP BY college_id ORDER BY count(*) DESC LIMIT 2");
    if (rows.length < 2) throw new Error("need two colleges with data to prove isolation");
    A = rows[0].college_id;
    B = rows[1].college_id;
  }
  const tables = (await client.query(
    `SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
       AND policyname IN ('tenant_isolation', 'tenant_isolation_derived', 'tenant_isolation_identity', 'tenant_isolation_scope') ORDER BY 1`,
  )).rows.map((r) => r.tablename);
  const hasCollege = new Set((await client.query(`SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='college_id'`)).rows.map((r) => r.table_name));
  let withRows = 0;
  for (const t of tables) {
    const ids = async (settings) => new Set((await q(settings, `SELECT ctid::text AS id FROM "${t}"`)).map((r) => r.id));
    const none = await ids({});
    const a = await ids({ "app.college_id": A });
    const b = await ids({ "app.college_id": B });
    if (a.size + b.size > 0) withRows++;
    check(`${t}: nothing visible with no scope`, none.size === 0, `${none.size} rows`);
    const overlap = [...a].filter((x) => b.has(x)).length;
    // Global rows (module rules GLOBAL, platform-owned NULL-college rows) are intentionally visible to both.
    const globalOk = ["module_access_rules", "lms_groups", "legacy_id_map"].includes(t);
    check(`${t}: colleges A and B see disjoint rows`, overlap === 0 || globalOk, `${overlap} shared rows`);
    if (hasCollege.has(t) && !globalOk) {
      const foreign = await count({ "app.college_id": A }, `SELECT count(*)::int AS n FROM "${t}" WHERE college_id IS NOT NULL AND college_id <> $1`, [A]);
      check(`${t}: college A sees no row stamped with another college`, foreign === 0, `${foreign} rows`);
    }
  }
  // Identity-core behaviour (needs migrations 0339/0340 applied or already present).
  const identity = (await client.query(`SELECT 1 FROM pg_policies WHERE tablename='colleges' AND policyname='tenant_isolation_identity'`)).rowCount > 0;
  if (identity) {
    const totalColleges = await count(SYS, "SELECT count(*)::int AS n FROM colleges");
    check("colleges: college A scope sees exactly its own college", (await count({ "app.college_id": A }, "SELECT count(*)::int AS n FROM colleges")) === 1);
    check("colleges: no scope sees none", (await count({}, "SELECT count(*)::int AS n FROM colleges")) === 0);
    check("colleges: system scope sees all", totalColleges >= 2);
    const multi = (await q(SYS, "SELECT user_id FROM college_memberships GROUP BY user_id HAVING count(DISTINCT college_id) >= 2 LIMIT 1"))[0]?.user_id;
    if (multi) {
      const expected = await count(SYS, "SELECT count(DISTINCT college_id)::int AS n FROM college_memberships WHERE user_id = $1", [multi]);
      check("workspace picker: a user with no college chosen sees exactly their own colleges", (await count({ "app.user_id": multi }, "SELECT count(*)::int AS n FROM colleges")) === expected);
      check("workspace picker: and their own memberships", (await count({ "app.user_id": multi }, "SELECT count(*)::int AS n FROM college_memberships WHERE user_id = $1", [multi])) >= expected);
      check("users: a person always sees themselves", (await count({ "app.user_id": multi }, "SELECT count(*)::int AS n FROM users WHERE id = $1", [multi])) === 1);
    } else note("no user with two colleges in this database: workspace picker not exercised");
    const onlyB = await q(SYS, `SELECT u.id FROM users u WHERE EXISTS (SELECT 1 FROM college_memberships m WHERE m.user_id = u.id AND m.college_id = $2)
                                  AND NOT EXISTS (SELECT 1 FROM college_memberships m WHERE m.user_id = u.id AND m.college_id = $1)
                                  AND NOT EXISTS (SELECT 1 FROM placement_recruiter_college_grants g WHERE g.recruiter_user_id = u.id) LIMIT 50`, [A, B]);
    if (onlyB.length) {
      const leaked = await count({ "app.college_id": A }, "SELECT count(*)::int AS n FROM users WHERE id = ANY($1::uuid[])", [onlyB.map((r) => r.id)]);
      check("users: college A cannot see people who belong only to college B", leaked === 0, `${leaked} visible`);
    }
    check("organizations: college A sees at least its organization and no unrelated one",
      (await count({ "app.college_id": A }, "SELECT count(*)::int AS n FROM organizations")) >= 1 &&
      (await count({ "app.college_id": A }, "SELECT count(*)::int AS n FROM organizations o WHERE NOT EXISTS (SELECT 1 FROM colleges c WHERE c.organization_id = o.id)")) === 0);
  }
  // Signed-in smoke at the database layer: for every role present in college A, a real member must still see
  // their own user row, college, organization, memberships and roles under enforcement (a blank page would show here).
  const roles = await q(SYS, `SELECT DISTINCT ON (r.role) r.role, m.id AS membership_id, m.user_id, m.college_id
                                FROM membership_roles r JOIN college_memberships m ON m.id = r.membership_id
                               WHERE m.college_id IN ($1, $2) ORDER BY r.role, m.college_id`, [A, B]);
  for (const r of roles) {
    const scope = { "app.user_id": r.user_id, "app.college_id": r.college_id, "app.role": r.role };
    const own = await count(scope, "SELECT count(*)::int AS n FROM users WHERE id = $1", [r.user_id]);
    const col = await count(scope, "SELECT count(*)::int AS n FROM colleges WHERE id = $1", [r.college_id]);
    const org = await count(scope, "SELECT count(*)::int AS n FROM organizations");
    const mem = await count(scope, "SELECT count(*)::int AS n FROM college_memberships WHERE id = $1", [r.membership_id]);
    const rol = await count(scope, "SELECT count(*)::int AS n FROM membership_roles WHERE membership_id = $1", [r.membership_id]);
    const rules = await count(scope, "SELECT count(*)::int AS n FROM module_access_rules");
    const totalRules = await count(SYS, "SELECT count(*)::int AS n FROM module_access_rules");
    check(`signed-in ${r.role}: sees own user, college, organization, membership and roles`, own === 1 && col === 1 && org >= 1 && mem === 1 && rol >= 1, JSON.stringify({ own, col, org, mem, rol }));
    check(`signed-in ${r.role}: module rules readable and narrower than all`, rules <= totalRules && (totalRules === 0 || rules > 0), `${rules}/${totalRules}`);
  }
  console.log(`signed-in roles exercised: ${roles.map((r) => r.role).join(", ")}`);
  console.log(`sweep: colleges ${A} and ${B}; ${tables.length} policied tables swept, ${withRows} with data in A or B; ${passes.length} checks passed`);
} finally {
  await client.query("ROLLBACK").catch(() => {});
  await client.end();
}
function note(message) {
  console.log(`note: ${message}`);
}
if (failures.length) {
  console.error(`${failures.length} failure(s):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("rls-isolation-sweep: all checks passed");
