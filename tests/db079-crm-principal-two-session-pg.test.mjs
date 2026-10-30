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
  collegeAdminUser: "30000000-0000-4000-8000-000000000002",
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
    assert.ok(changed.rowCount>=1,label+" must be revocable without held writer lock");
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
    "delete from membership_roles where membership_id=$1 and role in ('FACULTY','COLLEGE_ADMIN','TPO')",
    [owner],
  );
});
test("DB079 lead owner platform disable serializes with accepted insert",async()=>{
  await assertShareLockPreventsRevocation(
    "user",
    "update users set platform_status='DISABLED' where id=$1",
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


// DB079 also locks the relationship, recruiter profile, company, recruiter
// user and grant rows before accepting a linked lead. These fixtures exist
// only inside the disposable PG17 service database.
async function createLinkedRecruiterScope(){
  const db=await client(),token=randomUUID();
  try{
    await db.query("BEGIN");
    const co=(await db.query(
      "insert into placement_companies(name,status,created_by_user_id) "+
      "values($1,'ACTIVE',$2) returning id",["DB079 "+token,SEED_IDS.collegeAdminUser]
    )).rows[0];
    const rel=(await db.query(
      "insert into placement_company_relationships "+
      "(college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id) "+
      "values($1,$2,'ACTIVE',false,$3,$4) returning id",
      [college,co.id,owner,SEED_IDS.collegeAdminUser]
    )).rows[0];
    const recruiter=(await db.query(
      "insert into users(identity_uid,email,display_name,platform_status) "+
      "values($1,$2,'DB079 recruiter','ACTIVE') returning id",
      ["db079-"+token,"db079-"+token+"@example.test"]
    )).rows[0];
    await db.query(
      "insert into placement_recruiter_profiles(user_id,company_id,status,created_by_user_id) "+
      "values($1,$2,'ACTIVE',$3)",
      [recruiter.id,co.id,SEED_IDS.collegeAdminUser]
    );
    const grant=(await db.query(
      "insert into placement_recruiter_college_grants "+
      "(recruiter_user_id,company_relationship_id,status,granted_by_user_id) "+
      "values($1,$2,'ACTIVE',$3) returning id",
      [recruiter.id,rel.id,SEED_IDS.collegeAdminUser]
    )).rows[0];
    await db.query("COMMIT");
    return {companyId:co.id,relationshipId:rel.id,recruiterUserId:recruiter.id,grantId:grant.id};
  }catch(error){
    await db.query("ROLLBACK").catch(()=>{});
    throw error;
  }finally{await db.end();}
}
async function insertLinkedLead(db,scope){
  return db.query(
    "insert into placement_tpo_leads "+
    "(college_id,name,email_norm,owner_membership_id,company_relationship_id,recruiter_user_id) "+
    "values($1,'DB079 linked',$2,$3,$4,$5)",
    [college,"db079-linked-"+randomUUID()+"@example.test",owner,scope.relationshipId,scope.recruiterUserId],
  );
}
async function assertLinkedRevocation(label,sql,args){
  const scope=await createLinkedRecruiterScope();
  const writer=await client(),revoker=await client();
  try{
    await writer.query("BEGIN");
    await insertLinkedLead(writer,scope);
    await revoker.query("BEGIN");
    await revoker.query("SAVEPOINT blocked");
    await revoker.query("SET LOCAL lock_timeout='350ms'");
    await expectError(revoker.query(sql,args(scope)),"55P03");
    await revoker.query("ROLLBACK TO SAVEPOINT blocked");
    await writer.query("ROLLBACK");
    const changed=await revoker.query(sql,args(scope));
    assert.equal(changed.rowCount,1,label+" should be revocable after accepted lead releases locks");
    await revoker.query("SAVEPOINT failclosed");
    await expectError(insertLinkedLead(revoker,scope),"23514");
    await revoker.query("ROLLBACK TO SAVEPOINT failclosed");
    await revoker.query("ROLLBACK");
  }finally{
    await writer.query("ROLLBACK").catch(()=>{});
    await revoker.query("ROLLBACK").catch(()=>{});
    await writer.end();await revoker.end();
  }
}
test("DB079 active relationship archive races with linked recruiter lead",async()=>{
  await assertLinkedRevocation("relationship",
    "update placement_company_relationships set status='ARCHIVED',archived_at=now() where id=$1",
    scope=>[scope.relationshipId]);
});
test("DB079 active recruiter grant revocation races with linked lead",async()=>{
  await assertLinkedRevocation("recruiter grant",
    "update placement_recruiter_college_grants set status='REVOKED',revoked_by_user_id=$2,revoked_at=now() where id=$1",
    scope=>[scope.grantId,SEED_IDS.collegeAdminUser]);
});
test("DB079 recruiter profile suspension races with linked lead",async()=>{
  await assertLinkedRevocation("recruiter profile",
    "update placement_recruiter_profiles set status='SUSPENDED',suspended_at=now() where user_id=$1",
    scope=>[scope.recruiterUserId]);
});
test("DB079 global company archive races with linked lead",async()=>{
  await assertLinkedRevocation("company",
    "update placement_companies set status='ARCHIVED',archived_at=now() where id=$1",
    scope=>[scope.companyId]);
});
