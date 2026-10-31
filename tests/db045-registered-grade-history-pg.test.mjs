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
  for(const tag of [
    "0320_db045_grade_event_guards",
    "0321_db045_grade_event_completeness",
    "0322_db045_grade_event_enum_cast",
    "0324_db045_attendance_immutable_history",
  ]) assert.ok(journal.entries.some(entry=>entry.tag===tag),
    "Missing registered DB045 migration "+tag);
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

test("DB045 orphan event FK denial precedes validated action and actor CHECKs", async () => {
  await withRollback(async db => {
    // A BEFORE INSERT tenant/delivery scope guard resolves the schedule parent
    // before PostgreSQL runs CHECKs. Random orphan IDs MUST fail with 23503;
    // claiming they exercised role/action/version CHECKs would be false proof.
    const {rows}=await db.query(`
      SELECT conname,convalidated
      FROM pg_constraint
      WHERE conrelid='public.attendance_record_events'::regclass
        AND conname=ANY($1::text[])
    `,[[
      "attendance_record_events_actor_role_ck",
      "attendance_record_events_action_ck",
      "attendance_record_events_version_ck",
    ]]);
    assert.deepEqual(rows.map(row=>row.conname).sort(),[
      "attendance_record_events_action_ck",
      "attendance_record_events_actor_role_ck",
      "attendance_record_events_version_ck",
    ].sort());
    assert.ok(rows.every(row=>row.convalidated),
      "Registered attendance role/action/version CHECKs must be validated");

    // Actual invalid role/action/version behavior on a POPULATED current row
    // is exercised separately in college-admin-attendance.test.ts; no orphan
    // fixture is allowed to masquerade as that behavioral evidence.
    const cases=[
      {label:"unapproved actor role",role:"RECRUITER",action:"MARK",version:0},
      {label:"non-append history action",role:"SUPER_ADMIN",action:"DELETE",version:0},
      {label:"skipped initial row version",role:"SUPER_ADMIN",action:"MARK",version:5},
    ];
    for(const probe of cases){
      await db.query("SAVEPOINT db045_orphan_probe");
      try{
        await assert.rejects(db.query(`
          INSERT INTO attendance_record_events (
            attendance_record_id,schedule_event_id,delivery_id,membership_id,college_id,
            actor_user_id,actor_membership_id,actor_role,action,
            previous_status,new_status,previous_note,new_note,
            previous_marked_by_user_id,new_marked_by_user_id,
            previous_marked_at,new_marked_at,record_version_before,record_version_after
          ) VALUES (
            $1,$2,$3,$4,$5,$6,null,$7,$8,
            null,'PRESENT',null,null,null,$6,null,now(),null,$9
          )
        `,[
          randomUUID(),randomUUID(),randomUUID(),randomUUID(),randomUUID(),
          randomUUID(),probe.role,probe.action,probe.version,
        ]),error=>{
          assert.equal(error.code,"23503",
            probe.label+": orphan identity must fail before CHECK evaluation");
          return true;
        });
      }finally{
        await db.query("ROLLBACK TO SAVEPOINT db045_orphan_probe");
        await db.query("RELEASE SAVEPOINT db045_orphan_probe");
      }
    }
  });
});
