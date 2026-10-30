import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

// Do not call this on production or on a shared development database.
// Requires registered migration replay and >=2 seeded test memberships.
if (process.env.DB04_REGISTERED_PG !== "YES" || !process.env.TEST_DATABASE_URL)
  throw new Error("DB-007 registered PostgreSQL acceptance requires disposable opt-in");
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
after(async () => pool.end());
async function rollbackOnly(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    try { await fn(client); } finally { await client.query("ROLLBACK"); }
  } finally { client.release(); }
}
async function denies(db,sql,args,code) {
  await db.query("SAVEPOINT expected_rejection");
  try { await assert.rejects(db.query(sql,args),err => err?.code === code); }
  finally {
    await db.query("ROLLBACK TO SAVEPOINT expected_rejection");
    await db.query("RELEASE SAVEPOINT expected_rejection");
  }
}
async function members(db) {
  const rows = (await db.query(
    "SELECT id, college_id, user_id FROM college_memberships ORDER BY id LIMIT 2"
  )).rows;
  assert.equal(rows.length,2,"seed at least two disposable memberships");
  return rows;
}
async function receipt(db,m,purpose,opts={}) {
  const id=randomUUID();
  await db.query(`INSERT INTO profile_private_document_receipts
    (id,owning_membership_id,purpose,private_object_key,object_generation,
     sha256_hex,mime_type,size_bytes,scan_status,uploaded_by_user_id,revoked_at,related_entry_id)
    VALUES ($1,$2,$3,$4,'1',$5,'application/pdf',128,$6,$7,$8,$9)`,
    [id,m.id,purpose,`private/${m.college_id}/${m.id}/profile-verification/${randomUUID()}`,
     "a".repeat(64),opts.scanStatus??"CLEAN",m.user_id,opts.revokedAt??null,opts.relatedEntryId??null]);
  return id;
}
test("DB-007 registered profile tables and immutability triggers exist",async()=>{
  for(const name of ["learner_profile_education_entries","learner_profile_education_documents",
    "learner_profile_images","learner_profile_identity_summaries",
    "learner_profile_private_document_bindings","learner_profile_video_intros"]){
    const r=await pool.query("SELECT to_regclass($1)::text AS name",[name]);
    assert.equal(r.rows[0].name,name);
  }
  const names=["db04_education_document_usable_guard","db04_private_profile_binding_usable_guard",
    "db04_video_intro_usable_guard","db04_video_intro_update_guard",
    "db04_video_intro_no_truncate",
    "db04_profile_verification_events_immutable","db04_profile_verification_events_no_truncate",
    "db04_profile_verifications_revision"];
  const installed=(await pool.query(
    "SELECT tgname,count(*)::int AS n FROM pg_trigger WHERE NOT tgisinternal AND tgname=ANY($1) GROUP BY tgname",
    [names],
  )).rows;
  assert.deepEqual(installed.map(x=>x.tgname).sort(),[...names].sort());
  assert.ok(installed.every(x=>x.n===1));
});
test("normalized education enforces active unique history and same-owner clean receipts",async()=>{
  await rollbackOnly(async db=>{
    const [owner,other]=await members(db);
    const good=await receipt(db,owner,"MARKSHEET");
    const foreign=await receipt(db,other,"MARKSHEET");
    const bad=await receipt(db,owner,"MARKSHEET",{scanStatus:"PENDING"});
    const wronglyLinked=await receipt(db,owner,"MARKSHEET",{relatedEntryId:randomUUID()});
    const eduId=randomUUID();
    await db.query(`INSERT INTO learner_profile_education_entries
      (id,learner_membership_id,education_type,institution_name,grading_type,
       grade_obtained,max_grade,is_recent_education) VALUES
      ($1,$2,'UG','Disposable College','CGPA','8.6','10',true)`,[eduId,owner.id]);
    await denies(db,`INSERT INTO learner_profile_education_entries
      (learner_membership_id,education_type,institution_name,grading_type,
       grade_obtained,max_grade,is_recent_education) VALUES
      ($1,'UG','Disposable College','GPA','9','10',true)`,[owner.id],"23505");
    await denies(db,`INSERT INTO learner_profile_education_documents
      (education_entry_id,learner_membership_id,receipt_id,purpose)
       VALUES($1,$2,$3,'MARKSHEET')`,[eduId,owner.id,foreign],"23514");
    await denies(db,`INSERT INTO learner_profile_education_documents
      (education_entry_id,learner_membership_id,receipt_id,purpose)
       VALUES($1,$2,$3,'MARKSHEET')`,[eduId,owner.id,bad],"23514");
    await denies(db,`INSERT INTO learner_profile_education_documents
      (education_entry_id,learner_membership_id,receipt_id,purpose)
       VALUES($1,$2,$3,'MARKSHEET')`,[eduId,owner.id,wronglyLinked],"23514");
    await db.query(`INSERT INTO learner_profile_education_documents
      (education_entry_id,learner_membership_id,receipt_id,purpose)
       VALUES($1,$2,$3,'MARKSHEET')`,[eduId,owner.id,good]);
  });
});
test("private binding and one-time video intro reject unclean evidence and mutation",async()=>{
  await rollbackOnly(async db=>{
    const [owner,other]=await members(db);
    const good=await receipt(db,owner,"RESUME");
    const foreign=await receipt(db,other,"RESUME");
    const rejected=await receipt(db,owner,"RESUME",{scanStatus:"REJECTED"});
    await denies(db,`INSERT INTO learner_profile_private_document_bindings
       (learner_membership_id,purpose,receipt_id) VALUES($1,'RESUME',$2)`,
       [owner.id,foreign],"23514");
    await denies(db,`INSERT INTO learner_profile_private_document_bindings
       (learner_membership_id,purpose,receipt_id) VALUES($1,'RESUME',$2)`,
       [owner.id,rejected],"23514");
    await db.query(`INSERT INTO learner_profile_private_document_bindings
       (learner_membership_id,purpose,receipt_id) VALUES($1,'RESUME',$2)`,[owner.id,good]);
    const video=await receipt(db,owner,"VIDEO_INTRO");
    await db.query("INSERT INTO learner_profile_video_intros (learner_membership_id,receipt_id) VALUES ($1,$2)",
      [owner.id,video]);
    await denies(db,"UPDATE learner_profile_video_intros SET uploaded_at=now() WHERE learner_membership_id=$1",[owner.id],"55000");
    await denies(db,"DELETE FROM learner_profile_video_intros WHERE learner_membership_id=$1",[owner.id],"55000");
  });
});
test("verification history is immutable and ownership/version changes cannot bypass writer",async()=>{
  await rollbackOnly(async db=>{
    const [owner]=await members(db),id=randomUUID();
    await db.query(`INSERT INTO profile_verifications
      (id,learner_membership_id,section,status,submitted_snapshot,submitted_at,row_version)
      VALUES ($1,$2,'EDUCATION','SUBMITTED','{}'::jsonb,now(),1)`,[id,owner.id]);
    const event=randomUUID();
    await db.query(`INSERT INTO profile_verification_events
      (id,verification_id,action,actor_kind,actor_user_id,prior_version,next_version)
      VALUES($1,$2,'SUBMITTED','LEARNER',$3,0,1)`,[event,id,owner.user_id]);
    await denies(db,"UPDATE profile_verification_events SET action='VERIFIED' WHERE id=$1",[event],"23514");
    await denies(db,"DELETE FROM profile_verification_events WHERE id=$1",[event],"23514");
    await denies(db,"UPDATE profile_verifications SET row_version=1 WHERE id=$1",[id],"23514");
    await db.query("UPDATE profile_verifications SET row_version=2 WHERE id=$1",[id]);
  });
});


test("DB-080 registered gallery owner/state negatives and DB-081 qualification GPA/year rules",async()=>{
  await rollbackOnly(async db=>{
    const [owner,other]=await members(db);
    // The DB-080 persistence contract must reject a valid receipt belonging
    // to a different learner, and reject non-image purposes even for self.
    const ownImage=await receipt(db,owner,"PROFILE_IMAGE");
    const otherImage=await receipt(db,other,"PROFILE_IMAGE");
    const marksheet=await receipt(db,owner,"MARKSHEET");
    const imageId=randomUUID();
    await db.query(
      "INSERT INTO learner_profile_images (id,learner_membership_id,receipt_id) VALUES ($1,$2,$3)",
      [imageId,owner.id,ownImage],
    );
    await denies(db,
      "INSERT INTO learner_profile_images (learner_membership_id,receipt_id) VALUES ($1,$2)",
      [owner.id,otherImage],"23503");
    await denies(db,
      "INSERT INTO learner_profile_images (learner_membership_id,receipt_id) VALUES ($1,$2)",
      [other.id,ownImage],"23503");
    await denies(db,
      "INSERT INTO learner_profile_images (learner_membership_id,receipt_id) VALUES ($1,$2)",
      [owner.id,marksheet],"23503");
    await denies(db,
      "INSERT INTO learner_profile_images (learner_membership_id,receipt_id,display_order) VALUES ($1,$2,-1)",
      [owner.id,otherImage],"23514");
    await denies(db,
      "UPDATE learner_profile_images SET is_active=false WHERE id=$1",
      [imageId],"23514");
    await db.query(
      "UPDATE learner_profile_images SET is_active=false,deactivated_at=now() WHERE id=$1",
      [imageId],
    );
    const inactive=(await db.query(
      "SELECT is_active,deactivated_at FROM learner_profile_images WHERE id=$1",[imageId]
    )).rows[0];
    assert.equal(inactive.is_active,false);
    assert.ok(inactive.deactivated_at);
    await denies(db,
      "INSERT INTO learner_profile_images (learner_membership_id,receipt_id) VALUES ($1,$2)",
      [owner.id,ownImage],"23505");

    // A valid GPA education is accepted without relying on a conflicting
    // is_recent_education insert that could hide an incorrect grading CHECK.
    await db.query(
      "INSERT INTO learner_profile_education_entries "+
      "(learner_membership_id,education_type,institution_name,grading_type,grade_obtained,max_grade,start_year,end_year) "+
      "VALUES ($1,'UG','Disposable College','GPA','3.8','4.0',2022,2026)",
      [owner.id],
    );
    await denies(db,
      "INSERT INTO learner_profile_education_entries "+
      "(learner_membership_id,education_type,institution_name,grading_type,grade_obtained,max_grade,start_year,end_year) "+
      "VALUES ($1,'UG','Disposable College','GPA','3.8','4.0',2027,2026)",
      [owner.id],"23514");
    await denies(db,
      "INSERT INTO learner_profile_education_entries "+
      "(learner_membership_id,education_type,institution_name,grading_type,grade_obtained,max_grade,is_currently_pursuing,end_year) "+
      "VALUES ($1,'UG','Disposable College','GPA','3.8','4.0',true,2026)",
      [owner.id],"23514");
  });
});
