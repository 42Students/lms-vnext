#!/usr/bin/env node
/**
 * DB-061: two real PostgreSQL sessions sending on one committed thread.
 * Requires freshly reset, explicitly disposable PostgreSQL 17. Committed
 * fixtures remain ONLY in that throwaway database: the append-only source
 * contract deliberately forbids deleting historical messages/threads.
 */
import assert from "node:assert/strict";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if (process.env.DB09_ISOLATED_TEST_DATABASE !== "1" ||
    !process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
  throw Error("DB061 concurrent witness requires matching explicitly disposable PG URLs and DB09 opt-in");
}
assertDb018DisposableTarget({...process.env, DB018_ISOLATED_TEST_DATABASE: "1"}, {serviceBound: true});

const connection = process.env.TEST_DATABASE_URL;
const setup = new pg.Client({connectionString:connection});
const first = new pg.Client({connectionString:connection});
const second = new pg.Client({connectionString:connection});
const suffix = process.pid + "-" + Date.now();
let firstStarted = false, secondStarted = false;

async function row(client, sql, args=[]) {
  const {rows} = await client.query(sql,args);
  assert.equal(rows.length,1,"Expected one fixture row");
  return rows[0];
}

try {
  await Promise.all([setup.connect(),first.connect(),second.connect()]);
  await setup.query("BEGIN");
  const college = await row(setup, "select id from colleges where code='SEED-A'");
  const admin = await row(setup, "select id from users where email='collegeadmin.seed@example.com'");
  const faculty = await row(setup, "select id from users where email='faculty.seed@example.com'");
  const owner = await row(setup,
    "select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.college_id=$1 and m.user_id=$2 and m.status='ACTIVE' and r.role='FACULTY'",
    [college.id,faculty.id]);
  const company = await row(setup,
    "insert into placement_companies(name,status,created_by_user_id) values($1,'ACTIVE',$2) returning id",
    ["DB061 message concurrency "+suffix,admin.id]);
  const relationship = await row(setup,
    "insert into placement_company_relationships(college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id) values($1,$2,'ACTIVE',false,$3,$4) returning id",
    [college.id,company.id,owner.id,admin.id]);
  const recruiter = await row(setup,
    "insert into users(identity_uid,email,display_name,platform_status) values($1,$2,'DB061 concurrent recruiter','ACTIVE') returning id",
    ["db061-conc-"+suffix,"db061-conc-"+suffix+"@example.invalid"]);
  await setup.query(
    "insert into placement_recruiter_profiles(user_id,company_id,status,created_by_user_id) values($1,$2,'ACTIVE',$3)",
    [recruiter.id,company.id,admin.id]);
  await setup.query(
    "insert into placement_recruiter_college_grants(recruiter_user_id,company_relationship_id,status,granted_by_user_id,valid_until) values($1,$2,'ACTIVE',$3,statement_timestamp()+interval '7 days')",
    [recruiter.id,relationship.id,admin.id]);
  const thread = await row(setup,
    "insert into placement_tpo_message_threads(college_id,recruiter_user_id) values($1,$2) returning id",
    [college.id,recruiter.id]);
  await setup.query("COMMIT");

  await first.query("BEGIN"); firstStarted=true;
  await first.query("SET LOCAL statement_timeout = '10000ms'");
  const firstMessage = await row(first,
    "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body,created_at) values($1,'TPO',$2,'first',statement_timestamp()+interval '2 seconds') returning id",
    [thread.id,admin.id]);
  await first.query("select id from placement_tpo_message_threads where id=$1 for update",[thread.id]);
  await first.query(
    "update placement_tpo_message_threads set last_message_at=(select max(created_at) from placement_tpo_messages where thread_id=$1) where id=$1",
    [thread.id]);

  await second.query("BEGIN"); secondStarted=true;
  await second.query("SET LOCAL statement_timeout = '10000ms'");
  const secondMessage = await row(second,
    "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body) values($1,'TPO',$2,'second') returning id",
    [thread.id,admin.id]);

  let secondLockResolved=false;
  const secondLock=second.query(
    "select id from placement_tpo_message_threads where id=$1 for update",[thread.id])
    .then(result=>{secondLockResolved=true;return result;});
  // Prove the second sender cannot bypass the first sender's row lock.
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(secondLockResolved,false,"concurrent sender bypassed the thread serialization lock");

  await first.query("COMMIT"); firstStarted=false;
  await secondLock;
  await second.query(
    "update placement_tpo_message_threads set last_message_at=(select max(created_at) from placement_tpo_messages where thread_id=$1) where id=$1",
    [thread.id]);
  await second.query("COMMIT"); secondStarted=false;

  const verification=await row(setup,
    `select count(m.id)::integer as message_count,
       count(distinct m.id)::integer as unique_messages,
       t.last_message_at is not distinct from max(m.created_at) as exact_max_projection
       from placement_tpo_message_threads t
       join placement_tpo_messages m on m.thread_id=t.id
       where t.id=$1 group by t.id,t.last_message_at`,
    [thread.id]);
  assert.equal(verification.message_count,2,"two concurrent sends must both persist");
  assert.equal(verification.unique_messages,2,"concurrent messages must retain distinct history");
  assert.equal(verification.exact_max_projection,true,"concurrent commits must preserve exact max persisted chronology");
  assert.notEqual(firstMessage.id,secondMessage.id);
  process.stdout.write("DB061 two-session registered PostgreSQL chronology concurrency PASSED: 2 committed messages, exact MAX projection, row-lock serialization (disposable only)\n");
} finally {
  for (const [client,active] of [[second,secondStarted],[first,firstStarted]]) {
    if (active) try { await client.query("ROLLBACK"); } catch {}
  }
  await Promise.allSettled([setup.end(),first.end(),second.end()]);
}
