import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

if (process.env.DB02_REGISTERED_PROGRESSION !== "YES" || !process.env.TEST_DATABASE_URL) {
  throw new Error("DB-005 registered progression witness requires an explicit disposable database");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
after(async () => pool.end());
const deptId = "21000000-0000-4000-8000-000000000001";

async function rollbackOnly(fn) {
  const client = await pool.connect();
  try { await client.query("BEGIN"); try { await fn(client); } finally { await client.query("ROLLBACK"); } }
  finally { client.release(); }
}
async function denied(db, query, params, reason) {
  await db.query("SAVEPOINT denied");
  await assert.rejects(db.query(query, params), e => e.code === "23514" && e.message.includes(reason));
  await db.query("ROLLBACK TO SAVEPOINT denied");
  await db.query("RELEASE SAVEPOINT denied");
}
async function fixture(db) {
  const suffix = randomUUID().slice(0,8);
  const college = (await db.query("SELECT college_id FROM departments WHERE id=$1",[deptId])).rows[0].college_id;
  const period = (await db.query("INSERT INTO academic_periods(college_id,name,code,start_date,end_date) VALUES($1,$2,$3,'2025-08-01','2026-06-30') RETURNING id",
    [college, "DB005 period "+suffix, "D5Y-"+suffix])).rows[0].id;
  const program = (await db.query("INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,4) RETURNING id",
    [deptId, "DB005 program "+suffix, "D5P-"+suffix])).rows[0].id;
  const cohort = (await db.query("INSERT INTO cohorts(program_id,name,code,start_period_id) VALUES($1,$2,$3,$4) RETURNING id",
    [program, "DB005 cohort "+suffix, "D5B-"+suffix, period])).rows[0].id;
  return { period,program,cohort,suffix };
}
test("0051 is physically registered with canonical state and immutable history triggers", async () => {
  for (const name of ["cohort_progression_state","cohort_progression_events"]) {
    const r = await pool.query("SELECT to_regclass($1)::text AS name",[name]);
    assert.equal(r.rows[0].name,name);
  }
  const trig = await pool.query(`SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname IN
    ('db02_cohort_progression_state_guard','db02_cohort_promotion_readiness_guard',
    'db02_cohort_progression_history','db02_cohort_progression_events_immutable',
    'db02_cohort_progression_events_no_truncate','db02_cohort_progression_initialize',
    'db02_program_duration_reduction_guard')`);
  assert.equal(trig.rows.length,7);
});
test("new cohort automatically persists term 1, July-boundary year, and empty history", async () => {
  await rollbackOnly(async db => {
    const {cohort,period} = await fixture(db);
    const row = (await db.query("SELECT current_term_number,current_academic_year_start,current_period_id,version FROM cohort_progression_state WHERE cohort_id=$1",[cohort])).rows[0];
    assert.deepEqual([row.current_term_number,row.current_academic_year_start,row.current_period_id,Number(row.version)],[1,2025,period,0]);
    const events = await db.query("SELECT count(*)::integer AS n FROM cohort_progression_events WHERE cohort_id=$1",[cohort]);
    assert.equal(events.rows[0].n,0);
    await denied(db,"UPDATE cohort_progression_state SET version=1 WHERE cohort_id=$1",[cohort],"correction must change");
    await denied(db,"UPDATE cohort_progression_state SET current_term_number=3,version=1 WHERE cohort_id=$1",[cohort],"exactly one term");
  });
});
test("correction then expected-version promotion writes exactly two immutable events", async () => {
  await rollbackOnly(async db => {
    const {cohort,program,suffix} = await fixture(db);
    const corrected = await db.query("UPDATE cohort_progression_state SET current_academic_year_start=2026,version=version+1 WHERE cohort_id=$1 AND version=0 RETURNING version",[cohort]);
    assert.equal(corrected.rowCount,1);
    const term = (await db.query("INSERT INTO program_terms(program_id,term_number,name) VALUES($1,2,'Semester 2') RETURNING id",[program])).rows[0].id;
    const course = (await db.query("INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",[deptId,"DB005 course "+suffix,"D5C-"+suffix])).rows[0].id;
    await db.query("INSERT INTO program_term_courses(program_term_id,course_id,display_order) VALUES($1,$2,1)",[term,course]);
    await db.query("UPDATE cohorts SET status='ACTIVE' WHERE id=$1",[cohort]);
    const result = await db.query("UPDATE cohort_progression_state SET current_term_number=2,version=version+1 WHERE cohort_id=$1 AND version=1 RETURNING version",[cohort]);
    assert.equal(result.rowCount,1);
    assert.equal(Number(result.rows[0].version),2);
    const stale = await db.query("UPDATE cohort_progression_state SET current_term_number=3,version=version+1 WHERE cohort_id=$1 AND version=1",[cohort]);
    assert.equal(stale.rowCount,0);
    const events = (await db.query("SELECT event_kind,from_term_number,to_term_number,state_version FROM cohort_progression_events WHERE cohort_id=$1 ORDER BY state_version",[cohort])).rows;
    assert.deepEqual(events.map(e=>[e.event_kind,e.from_term_number,e.to_term_number,Number(e.state_version)]),
      [["CORRECTION",1,1,1],["PROMOTION",1,2,2]]);
    await denied(db,"UPDATE cohort_progression_events SET reason='forged' WHERE cohort_id=$1",[cohort],"database-owned and immutable");
    await denied(db,"DELETE FROM cohort_progression_events WHERE cohort_id=$1",[cohort],"database-owned and immutable");
  });
});
test("missing target semester curriculum blocks direct promotion and events cannot be forged", async () => {
  await rollbackOnly(async db => {
    const {cohort} = await fixture(db);
    await db.query("UPDATE cohorts SET status='ACTIVE' WHERE id=$1",[cohort]);
    await denied(db,"UPDATE cohort_progression_state SET current_term_number=2,version=1 WHERE cohort_id=$1",[cohort],"target program term");
    await denied(db,"INSERT INTO cohort_progression_events(cohort_id,from_term_number,to_term_number,event_kind,state_version) VALUES($1,1,2,'PROMOTION',1)",[cohort],"database-owned and immutable");
  });
});
