import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {Pool, type PoolClient} from "pg";
import {expect,it} from "vitest";
import {SEED_IDS} from "../../scripts/db-seed-data";

/**
 * DB042 STAGED SQL executable PostgreSQL acceptance (opt-in).
 *
 * Requires a disposable, migrated and seeded PG17 DATABASE, never production.
 * All DDL, fixture writes and negative attempts run on ONE transaction in
 * one connection and are rolled back even if a witness fails.
 *
 * The deferred marker constraint is forced IMMEDIATE to surface failures
 * inside savepoints. This test deliberately does NOT register a migration.
 */
function assertWitnessDisposableDb(){
 const check=spawnSync(process.execPath,["scripts/db01-test-database-guard.mjs"],{
  env:process.env,encoding:"utf8",
 });
 if(check.error||check.status!==0){
  throw new Error("DB06 witness refused unsafe PostgreSQL target: "+
   (check.error?.message??check.stderr??"preflight failed"));
 }
}

const enabled=Boolean(process.env.TEST_DATABASE_URL &&
  process.env.DB06_RUN_ATTENDANCE_SCOPE_WITNESSES==="1" &&
  process.env.DB06_DISPOSABLE_DB_CONFIRM==="YES");
const run=enabled?it:it.skip;

async function expectRejectCode(
 client:PoolClient,query:string,params:unknown[],code="23514",
){
 await client.query("SAVEPOINT db06_witness_negative");
 let thrown:unknown;
 try{
  await client.query(query,params);
  await client.query("SET CONSTRAINTS ALL IMMEDIATE");
 }catch(err){thrown=err;}
 finally{
  await client.query("ROLLBACK TO SAVEPOINT db06_witness_negative");
  await client.query("RELEASE SAVEPOINT db06_witness_negative");
 }
 expect((thrown as {code?:string}|undefined)?.code).toBe(code);
}

run("DB042 staged roster, marker and retention guards reject SQL bypasses",async()=>{
 assertWitnessDisposableDb();
 const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
 const client=await pool.connect();
 const uid=randomUUID();
 const member=randomUUID();
 const foreignUser=randomUUID();
 const foreignMember=randomUUID();
 const ids={
  program:randomUUID(),period:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),course:randomUUID(),offering:randomUUID(),
  delivery:randomUUID(),enrollment:randomUUID(),sectionEnrollment:randomUUID(),
  schedule:randomUUID(),
 };
 const nonce=randomUUID().slice(0,10);
 try{
  await client.query("BEGIN");
  await client.query(readFileSync(
    "docs/planning/sql/db06-attendance-scope-candidate.sql","utf8",
  ));
  await client.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
   [uid,"db06-attendance-"+uid,"DB06 synthetic learner"]);
  await client.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
   [member,uid,SEED_IDS.collegeA]);
  await client.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",[member]);
  await client.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
   [foreignUser,"db06-attendance-"+foreignUser,"DB06 foreign learner"]);
  await client.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
   [foreignMember,foreignUser,SEED_IDS.collegeB]);
  await client.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",[foreignMember]);

  await client.query(
   "insert into programs(id,department_id,name,code,duration_terms) values($1,$2,$3,$4,8)",
   [ids.program,SEED_IDS.departmentA,"DB06 Attendance","AT-P-"+nonce],
  );
  await client.query(
   "insert into academic_periods(id,college_id,name,code,start_date,end_date) values($1,$2,$3,$4,'2020-01-01','2040-12-31')",
   [ids.period,SEED_IDS.collegeA,"DB06 Attendance Period","AT-T-"+nonce],
  );
  await client.query(
   "insert into cohorts(id,program_id,name,code,start_period_id) values($1,$2,$3,$4,$5)",
   [ids.cohort,ids.program,"DB06 Attendance Cohort","AT-C-"+nonce,ids.period],
  );
  await client.query(
   "insert into sections(id,cohort_id,academic_period_id,name,code) values($1,$2,$3,$4,$5)",
   [ids.section,ids.cohort,ids.period,"DB06 Attendance Section","AT-S-"+nonce],
  );
  await client.query(
   "insert into courses(id,department_id,name,code) values($1,$2,$3,$4)",
   [ids.course,SEED_IDS.departmentA,"DB06 Attendance Course","AT-CO-"+nonce],
  );
  await client.query(
   "insert into course_offerings(id,course_id,cohort_id,academic_period_id) values($1,$2,$3,$4)",
   [ids.offering,ids.course,ids.cohort,ids.period],
  );
  await client.query(
   "insert into course_section_deliveries(id,offering_id,section_id) values($1,$2,$3)",
   [ids.delivery,ids.offering,ids.section],
  );
  await client.query(
   "insert into learner_program_enrollments(id,membership_id,program_id,cohort_id) values($1,$2,$3,$4)",
   [ids.enrollment,member,ids.program,ids.cohort],
  );
  await client.query(
   "insert into section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) values($1,$2,$3,$4)",
   [ids.sectionEnrollment,ids.enrollment,ids.section,ids.period],
  );
  await client.query(
   "insert into section_schedule_events(id,section_id,title,starts_at,ends_at) values($1,$2,'DB06 class',now()-interval '2 hours',now()-interval '1 hour')",
   [ids.schedule,ids.section],
  );
  await client.query(
   "insert into section_schedule_event_courses(schedule_event_id,delivery_id) values($1,$2)",
   [ids.schedule,ids.delivery],
  );

  // An individual admin correction without a full MARKED session is valid
  // and must not silently count all classmates PRESENT.
  const inserted=await client.query(
   `insert into attendance_records(schedule_event_id,membership_id,status,marked_by_user_id,marked_at)
    values($1,$2,'ABSENT',$3,now()) returning id`,
   [ids.schedule,member,SEED_IDS.collegeAdminUser],
  );
  expect(inserted.rows).toHaveLength(1);
  const recordId=inserted.rows[0]!.id as string;
  const sessions=await client.query(
   "select schedule_event_id from attendance_sessions where schedule_event_id=$1",
   [ids.schedule],
  );
  expect(sessions.rows).toHaveLength(0);

  // Wrong roster/tenant and a non-faculty learner marker must fail.
  await expectRejectCode(client,
   "update attendance_records set membership_id=$1 where id=$2",
   [foreignMember,recordId],
  );
  await expectRejectCode(client,
   "update attendance_records set marked_by_user_id=$1 where id=$2",
   [uid,recordId],
  );
  await expectRejectCode(client,
   "delete from attendance_records where id=$1",[recordId],
  );
  await client.query(
   "update attendance_records set status='PRESENT',marked_by_user_id=$1,marked_at=now(),updated_at=now() where id=$2",
   [SEED_IDS.collegeAdminUser,recordId],
  );
  const persisted=await client.query(
   "select id,status from attendance_records where id=$1",[recordId],
  );
  expect(persisted.rows).toMatchObject([{id:recordId,status:"PRESENT"}]);

  await client.query(
   "insert into attendance_sessions(schedule_event_id,status,marked_by_user_id,marked_at) values($1,'MARKED',$2,now())",
   [ids.schedule,SEED_IDS.collegeAdminUser],
  );
  await expectRejectCode(client,
   "delete from attendance_sessions where schedule_event_id=$1",[ids.schedule],
  );
  await expectRejectCode(client,
   "update attendance_sessions set status='UNMARKED' where schedule_event_id=$1",[ids.schedule],
  );
 }finally{
  await client.query("ROLLBACK").catch(()=>undefined);
  client.release();
  await pool.end();
 }
});
