import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if (process.env.DB045_DISPOSABLE_PG !== "1") {
  throw new Error("DB045 grade-event guards require explicit disposable PG17");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));

async function withRollback(work) {
  const db = new pg.Client({
    connectionString: process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 12000,
  });
  await db.connect();
  try {
    await db.query("BEGIN");
    return await work(db);
  } finally {
    await db.query("ROLLBACK").catch(() => {});
    await db.end();
  }
}
async function mustReject23514(work) {
  await assert.rejects(work, error => {
    assert.equal(error.code, "23514");
    return true;
  });
}

test("DB045 registered grade-ledger INSERT, row-mutation and TRUNCATE guards active", async () => {
  assert.equal(journal.entries.at(-1)?.tag, "0324_db045_attendance_immutable_history");
  await withRollback(async db => {
    const { rows } = await db.query(`
      SELECT tgname,tgenabled FROM pg_trigger
      WHERE tgrelid='public.assignment_grade_events'::regclass
        AND NOT tgisinternal AND tgname IN (
          'db06_grade_event_scope_guard',
          'db06_grade_events_no_mutation',
          'db06_grade_events_no_truncate'
        )
    `);
    assert.deepEqual(rows.map(x => x.tgname).sort(), [
      "db06_grade_event_scope_guard",
      "db06_grade_events_no_mutation",
      "db06_grade_events_no_truncate",
    ].sort());
    assert.ok(rows.every(x => x.tgenabled === "O" || x.tgenabled === "A"));
    // Deferred completeness lives on the mutable parent, not the ledger.
    const required = await db.query(`
      SELECT tgname,tgenabled,tgdeferrable,tginitdeferred
      FROM pg_trigger
      WHERE tgrelid='public.assignment_submissions'::regclass
        AND NOT tgisinternal
        AND tgname='db06_assignment_grade_event_required'
    `);
    assert.equal(required.rows.length, 1);
    assert.ok(["O", "A"].includes(required.rows[0].tgenabled));
    assert.equal(required.rows[0].tgdeferrable, true);
    assert.equal(required.rows[0].tginitdeferred, true);
  });
});

test("DB045 immutable ledger rejects TRUNCATE even when empty", async () => {
  await withRollback(db => mustReject23514(() =>
    db.query("TRUNCATE TABLE assignment_grade_events")
  ));
});

test("DB045 rejects forged orphan grade event before FK evaluation", async () => {
  const random = () => randomUUID();
  await withRollback(db => mustReject23514(() => db.query(`
    INSERT INTO assignment_grade_events (
      assignment_submission_id,assignment_id,delivery_id,
      learner_membership_id,college_id,actor_user_id,actor_membership_id,
      actor_role,action,previous_points,new_points,
      previous_grading_status,new_grading_status,
      previous_grade_published,new_grade_published,
      previous_graded_by_user_id,new_graded_by_user_id,
      previous_graded_at,new_graded_at,
      submission_version_before,submission_version_after
    ) VALUES (
      $1,$2,$3,$4,$5,$6,null,'SUPER_ADMIN','GRADE',null,1,
      'NOT_GRADED','GRADED',false,false,null,$6,null,now(),0,1
    )
  `, [random(),random(),random(),random(),random(),random()])));
});

test("DB045 status comparisons convert submission enums to ledger text", async () => {
  const migration = readFileSync("drizzle/0322_db045_grade_event_enum_cast.sql", "utf8");
  assert.match(migration, /e\.previous_grading_status = OLD\.grading_status::text/);
  assert.match(migration, /e\.new_grading_status = NEW\.grading_status::text/);
});

test("DB045 attendance event scope, immutability and deferred requirements active",async()=>{
 await withRollback(async db=>{
  const {rows}=await db.query(`select tgrelid::regclass::text table_name,tgname,tgenabled,tgdeferrable,tginitdeferred
   from pg_trigger where not tgisinternal and tgname in (
    'db06_attendance_event_scope_guard','db06_attendance_events_no_mutation',
    'db06_attendance_events_no_truncate','db06_attendance_record_version_guard',
    'db06_attendance_event_required') order by tgname`);
  assert.equal(rows.length,5);
  assert.ok(rows.every(x=>x.tgenabled==="O"||x.tgenabled==="A"));
  const required=rows.find(x=>x.tgname==="db06_attendance_event_required");
  assert.equal(required.table_name,"attendance_records");
  assert.equal(required.tgdeferrable,true);
  assert.equal(required.tginitdeferred,true);
 });
});
test("DB045 attendance event ledger rejects TRUNCATE",async()=>{
 await withRollback(db=>mustReject23514(()=>db.query("TRUNCATE attendance_record_events")));
});
