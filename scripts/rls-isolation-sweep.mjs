#!/usr/bin/env node
// Read-only isolation sweep over EVERY table that has a tenant policy (SEC-05-005/006/008, SEC-06-004/019).
// For each such table, under the real runtime role with app.rls_mode=enforce, it checks inside a rolled-back
// transaction that: no scope sees no rows; college A and college B see disjoint row sets; and neither sees a row
// that is stamped with the other college. Run against a disposable or dev database only, with the runtime URL:
//   DATABASE_URL=... SWEEP_ALLOW_DEV=1 node scripts/rls-isolation-sweep.mjs [collegeA collegeB]
// With no arguments it picks the two colleges that own the most membership rows.
import pg from "pg";

const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (runtime role) is required");
const host = new URL(url).hostname;
const local = ["127.0.0.1", "localhost", "::1"].includes(host);
if (!local && process.env.SWEEP_ALLOW_DEV !== "1") throw new Error("non-local database: set SWEEP_ALLOW_DEV=1 (dev only, never production)");

const client = new pg.Client({ connectionString: url });
await client.connect();
const failures = [];
const note = [];
async function scoped(settings, fn) {
  await client.query("BEGIN READ ONLY");
  try {
    for (const [k, v] of Object.entries({ "app.rls_mode": "enforce", ...settings })) await client.query("SELECT set_config($1, $2, true)", [k, v]);
    return await fn();
  } finally {
    await client.query("ROLLBACK");
  }
}
try {
  let [A, B] = process.argv.slice(2);
  if (!A || !B) {
    const rows = await scoped({ "app.system": "isolation-sweep" }, async () =>
      (await client.query("SELECT college_id FROM college_memberships GROUP BY college_id ORDER BY count(*) DESC LIMIT 2")).rows);
    if (rows.length < 2) throw new Error("need two colleges with data to prove isolation");
    A = rows[0].college_id;
    B = rows[1].college_id;
  }
  const tables = (await client.query(
    `SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public' AND policyname IN ('tenant_isolation', 'tenant_isolation_derived') ORDER BY 1`,
  )).rows.map((r) => r.tablename);
  let checked = 0;
  let withRows = 0;
  for (const t of tables) {
    const ids = (settings) => scoped(settings, async () => new Set((await client.query(`SELECT ctid::text AS id FROM "${t}"`)).rows.map((r) => r.id)));
    const none = await ids({});
    const a = await ids({ "app.college_id": A });
    const b = await ids({ "app.college_id": B });
    checked++;
    if (a.size + b.size > 0) withRows++;
    if (none.size !== 0) failures.push(`${t}: ${none.size} rows visible with no scope`);
    const overlap = [...a].filter((x) => b.has(x));
    if (overlap.length) failures.push(`${t}: ${overlap.length} rows visible to both colleges`);
    const hasCollege = (await client.query(`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='college_id'`, [t])).rowCount > 0;
    if (hasCollege) {
      const foreign = await scoped({ "app.college_id": A }, async () => (await client.query(`SELECT count(*)::int AS n FROM "${t}" WHERE college_id IS NOT NULL AND college_id <> $1`, [A])).rows[0].n);
      if (foreign) failures.push(`${t}: college A sees ${foreign} rows stamped with another college`);
    }
  }
  note.push(`${checked} policied tables swept, ${withRows} with data in A or B`);
  console.log(`isolation sweep: colleges ${A} and ${B}; ${note.join("; ")}`);
} finally {
  await client.end();
}
if (failures.length) {
  console.error(`${failures.length} failure(s):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("rls-isolation-sweep: all policied tables isolate the two colleges");
