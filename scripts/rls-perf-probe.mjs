#!/usr/bin/env node
// SEC-06-025: measures what enforcement costs. Runs the same read-only queries with the policies inert and
// enforced (college scope) and prints median and p95 milliseconds. Dev or disposable database only.
//   DATABASE_URL=... SWEEP_ALLOW_DEV=1 node scripts/rls-perf-probe.mjs [collegeId] [--budget=1.5]
// Fails when the enforced median exceeds budget x the inert median for any query (default 1.5x plus 2 ms).
import pg from "pg";

const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (runtime role) is required");
const local = ["127.0.0.1", "localhost", "::1"].includes(new URL(url).hostname);
if (!local && process.env.SWEEP_ALLOW_DEV !== "1") throw new Error("non-local database: set SWEEP_ALLOW_DEV=1 (dev only)");
const budget = Number((process.argv.find((a) => a.startsWith("--budget=")) ?? "--budget=1.5").split("=")[1]);

const client = new pg.Client({ connectionString: url });
await client.connect();
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const p95 = (xs) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * 0.95))];
async function time(settings, sql, runs = 30) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    await client.query("BEGIN READ ONLY");
    for (const [k, v] of Object.entries(settings)) await client.query("SELECT set_config($1, $2, true)", [k, v]);
    const t0 = performance.now();
    await client.query(sql);
    samples.push(performance.now() - t0);
    await client.query("ROLLBACK");
  }
  return samples;
}
let failed = 0;
try {
  let college = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
  if (!college) {
    await client.query("BEGIN READ ONLY");
    await client.query("SELECT set_config('app.system','perf-probe',true)");
    college = (await client.query("SELECT college_id FROM college_memberships GROUP BY college_id ORDER BY count(*) DESC LIMIT 1")).rows[0]?.college_id;
    await client.query("ROLLBACK");
  }
  if (!college) throw new Error("no college with data");
  // Direct tenant table, a deep derived chain (quiz answers -> attempts -> quizzes -> lessons ...), and a wide join.
  const queries = {
    "tenant table count": "SELECT count(*) FROM college_memberships",
    "derived table count (depth 1)": "SELECT count(*) FROM learner_profiles",
    "deep derived count": "SELECT count(*) FROM quiz_attempt_answers",
    "join across derived": "SELECT count(*) FROM placement_applications a JOIN placement_application_status_history h ON h.application_id = a.id",
  };
  for (const [name, sql] of Object.entries(queries)) {
    let inert;
    let enforced;
    try {
      inert = await time({}, sql);
      enforced = await time({ "app.rls_mode": "enforce", "app.college_id": college }, sql);
    } catch (error) {
      console.log(`SKIP  ${name}: ${error.message}`);
      continue;
    }
    const ok = median(enforced) <= median(inert) * budget + 2;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}: inert median ${median(inert).toFixed(1)} ms (p95 ${p95(inert).toFixed(1)}), enforced median ${median(enforced).toFixed(1)} ms (p95 ${p95(enforced).toFixed(1)})`);
  }
} finally {
  await client.end();
}
if (failed) process.exit(1);
