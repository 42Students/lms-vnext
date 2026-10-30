import { randomUUID } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";
// Canonical disposable seed identities. No TypeScript import loader required
// for this native Node PostgreSQL witness.
const SEED_IDS = {
  collegeA: "20000000-0000-4000-8000-000000000001",
  facultyUser: "30000000-0000-4000-8000-000000000003",
  facultyCollegeAMembership: "40000000-0000-4000-8000-000000000002",
};

if(process.env.DB079_CRM_RACE_PG!=="YES"||!process.env.TEST_DATABASE_URL)
  throw new Error("DB079 requires explicit disposable registered PG");
assertDb018DisposableTarget({...process.env,DB018_ISOLATED_TEST_DATABASE:"1"});

async function client(){
  const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
  await db.connect();
  return db;
}
const owner=SEED_IDS.facultyCollegeAMembership;
const college=SEED_IDS.collegeA;

async function insertLead(db){
  return db.query(
    "insert into placement_tpo_leads(college_id,name,email_norm,owner_membership_id) values($1,'DB079 race',$2,$3) returning id",
    [college, "db079-"+randomUUID()+"@example.test",owner],
  );
}

async function expectError(promise,code){
  await assert.rejects(promise,error=>{
    assert.equal(error?.code,code,String(error));
    return true;
  });
}

async function assertShareLockPreventsRevocation(label,updateSql,args){
  const writer=await client(), revoker=await client();
  try {
    await writer.query("BEGIN");
    await insertLead(writer); // db09_assert_lead_scoped_links locks owner, role and user FOR SHARE
    await revoker.query("BEGIN");
    await revoker.query("SAVEPOINT revocation_probe");
    await revoker.query("SET LOCAL lock_timeout='350ms'");
    await expectError(revoker.query(updateSql,args),"55P03");
    await revoker.query("ROLLBACK TO SAVEPOINT revocation_probe");
    await writer.query("ROLLBACK");
    // Revocation succeeds only after accepted writer releases its SHARE locks.
    const changed=await revoker.query(updateSql,args);
    assert.equal(changed.rowCount,1,label+" must be revocable without held writer lock");
    await revoker.query("SAVEPOINT denied_write");
    await expectError(insertLead(revoker),"23514");
    await revoker.query("ROLLBACK TO SAVEPOINT denied_write");
    await revoker.query("ROLLBACK");
  } finally {
    await writer.query("ROLLBACK").catch(()=>{});
    await revoker.query("ROLLBACK").catch(()=>{});
    await writer.end();
    await revoker.end();
  }
}

test("DB079 lead owner membership revocation serializes with accepted insert",async()=>{
  await assertShareLockPreventsRevocation(
    "membership",
    "update college_memberships set status='SUSPENDED' where id=$1",
    [owner],
  );
});
test("DB079 lead owner role removal serializes with accepted insert",async()=>{
  await assertShareLockPreventsRevocation(
    "role",
    "delete from membership_roles where membership_id=$1 and role='FACULTY'",
    [owner],
  );
});
test("DB079 lead owner platform disable serializes with accepted insert",async()=>{
  await assertShareLockPreventsRevocation(
    "user",
    "update users set platform_status='SUSPENDED' where id=$1",
    [SEED_IDS.facultyUser],
  );
});
test("DB079 registered append-only CRM activity history rejects TRUNCATE",async()=>{
  const db=await client();
  try {
    await db.query("BEGIN");
    await db.query("SAVEPOINT no_truncate");
    await expectError(db.query("TRUNCATE placement_tpo_lead_activities"),"23514");
    await db.query("ROLLBACK TO SAVEPOINT no_truncate");
    await db.query("ROLLBACK");
  } finally {
    await db.query("ROLLBACK").catch(()=>{});
    await db.end();
  }
});
