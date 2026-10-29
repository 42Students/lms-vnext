#!/usr/bin/env node
/**
 * L08 / DB-062, DB-079: real registered PostgreSQL acceptance for private
 * recruiter applicant notes. Never targets customer data; rollback only.
 * DB09_ISOLATED_TEST_DATABASE=1 TEST_DATABASE_URL=<disposable> node <this file>
 */
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";

if(process.env.DB09_ISOLATED_TEST_DATABASE!=="1"||!process.env.TEST_DATABASE_URL)
 throw Error("DB09 private note acceptance requires explicit disposable DB opt-in");
assertDb018DisposableTarget({...process.env,DB018_ISOLATED_TEST_DATABASE:"1"});
const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
const suffix=process.pid+"-"+Date.now();
let count=0,seq=0;
async function one(sql,args=[]){
 const {rows}=await db.query(sql,args);
 if(rows.length!==1)throw Error("Expected one row: "+sql);
 return rows[0];
}
async function reject(label,fn,sqlstate="23514"){
 const sp="l08_note_sp_"+(++seq);
 await db.query("SAVEPOINT "+sp);
 let rejected=false;
 try{await fn();}catch(error){
  if(error?.code!==sqlstate)throw Error(label+" expected "+sqlstate+" got "+(error?.code??error));
  rejected=true;
 }finally{
  await db.query("ROLLBACK TO SAVEPOINT "+sp);
  await db.query("RELEASE SAVEPOINT "+sp);
 }
 if(!rejected)throw Error(label+" incorrectly permitted");
 count++;
}
function equal(label,got,want){
 if(got!==want)throw Error(label+" expected "+want+" got "+got);
 count++;
}

await db.connect();
try{
 await db.query("BEGIN");
 const installed=await one("select to_regprocedure('db09_restrict_recruiter_private_note_lifecycle()') is not null as ready");
 equal("registered private note lifecycle trigger",installed.ready,true);
 const a=await one("select id from colleges where code='SEED-A'");
 const b=await one("select id from colleges where code='SEED-B'");
 const admin=await one("select id from users where email='collegeadmin.seed@example.com'");
 const faculty=await one("select id from users where email='faculty.seed@example.com'");
 const learner=await one("select id from users where email='learner.seed@example.com'");
 const owner=await one("select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.user_id=$1 and m.college_id=$2 and m.status='ACTIVE' and r.role='FACULTY'",[faculty.id,a.id]);
 const applicant=await one("select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.user_id=$1 and m.college_id=$2 and m.status='ACTIVE' and r.role='LEARNER'",[learner.id,a.id]);

 const co=await one("insert into placement_companies(name,status,created_by_user_id) values($1,'ACTIVE',$2) returning id",
  ["L08 private note "+suffix,admin.id]);
 const relationship=await one(
  "insert into placement_company_relationships(college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id) values($1,$2,'ACTIVE',false,$3,$4) returning id",
  [a.id,co.id,owner.id,admin.id]);
 const recruiter=await one(
  "insert into users(identity_uid,email,display_name,platform_status) values($1,$2,'L08 private recruiter','ACTIVE') returning id",
  ["l08-note-"+suffix,"l08-note-"+suffix+"@example.org"]);
 await db.query("insert into placement_recruiter_profiles(user_id,company_id,status,created_by_user_id) values($1,$2,'ACTIVE',$3)",
  [recruiter.id,co.id,admin.id]);
 const grant=await one(
  "insert into placement_recruiter_college_grants(recruiter_user_id,company_relationship_id,status,valid_until,granted_by_user_id) values($1,$2,'ACTIVE',now()+interval '30 days',$3) returning id",
  [recruiter.id,relationship.id,admin.id]);
 const season=await one("select id from placement_seasons where college_id=$1 and code='SEED-2026-27-A'",[a.id]);
 const job=await one(
  "insert into placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id) values($1,$2,$3,$4,'L08 private notes','FULL_TIME','ONSITE',$5) returning id",
  [a.id,season.id,relationship.id,"L08 note job "+suffix,admin.id]);
 const role=await one(
  "insert into placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) values($1,'Software developer','FULL_TIME','ONSITE',true) returning id",
  [job.id]);
 const application=await one(
  "insert into placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) values($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) returning id",
  [job.id,role.id,applicant.id,learner.id]);

 const note=await one(
  "insert into placement_recruiter_applicant_notes(recruiter_user_id,college_id,job_id,application_id,rating,note) values($1,$2,$3,$4,4,'Private assessment') returning id,created_at,updated_at",
  [recruiter.id,a.id,job.id,application.id]);
 if(note.updated_at<note.created_at)throw Error("Inserted note has invalid timestamp order");
 count++;

 await reject("wrong-college private note",()=>db.query(
  "insert into placement_recruiter_applicant_notes(recruiter_user_id,college_id,job_id,application_id,note) values($1,$2,$3,$4,'forged')",
  [recruiter.id,b.id,job.id,application.id]));
 await reject("ungranted faculty cannot own recruiter note",()=>db.query(
  "insert into placement_recruiter_applicant_notes(recruiter_user_id,college_id,job_id,application_id,note) values($1,$2,$3,$4,'forged')",
  [faculty.id,a.id,job.id,application.id]));
 await reject("future note creation timestamp",()=>db.query(
  "insert into placement_recruiter_applicant_notes(recruiter_user_id,college_id,job_id,application_id,note,created_at) values($1,$2,$3,$4,'future',statement_timestamp()+interval '1 day')",
  [recruiter.id,a.id,job.id,application.id]));
 await reject("private note updated before created",()=>db.query(
  "insert into placement_recruiter_applicant_notes(recruiter_user_id,college_id,job_id,application_id,note,updated_at) values($1,$2,$3,$4,'past',now()-interval '1 day')",
  [recruiter.id,a.id,job.id,application.id]));
 await reject("private note creation identity immutable",()=>db.query(
  "update placement_recruiter_applicant_notes set created_at=created_at-interval '1 second' where id=$1",[note.id]));
 await reject("private note recruiter identity immutable",()=>db.query(
  "update placement_recruiter_applicant_notes set recruiter_user_id=$2 where id=$1",[note.id,faculty.id]));
 await reject("private note parent job immutable",()=>db.query(
  "update placement_recruiter_applicant_notes set job_id=gen_random_uuid() where id=$1",[note.id]));
 await reject("private note application identity immutable",()=>db.query(
  "update placement_recruiter_applicant_notes set application_id=gen_random_uuid() where id=$1",[note.id]));
 await reject("private note cannot rewrite content without advancing clock",()=>db.query(
  "update placement_recruiter_applicant_notes set note='rewritten' where id=$1",[note.id]));
 await reject("private note cannot move updated_at backwards",()=>db.query(
  "update placement_recruiter_applicant_notes set updated_at=updated_at-interval '1 second' where id=$1",[note.id]));
 const updated=await one(
  "update placement_recruiter_applicant_notes set note='Authorized assessment',rating=5,updated_at=statement_timestamp() where id=$1 returning id,note,rating,updated_at",
  [note.id]);
 equal("authorized note content change",updated.note,"Authorized assessment");
 equal("authorized note rating change",updated.rating,5);
 if(updated.updated_at<=note.updated_at)throw Error("Authorized note changed without timestamp advancement");
 count++;
 await reject("private note cannot forge future updated_at",()=>db.query(
  "update placement_recruiter_applicant_notes set updated_at=statement_timestamp()+interval '1 day' where id=$1",[note.id]));

 await db.query("update placement_recruiter_college_grants set status='REVOKED',revoked_by_user_id=$2,revoked_at=statement_timestamp() where id=$1",
  [grant.id,admin.id]);
 await reject("revoked recruiter cannot create applicant notes",()=>db.query(
  "insert into placement_recruiter_applicant_notes(recruiter_user_id,college_id,job_id,application_id,note) values($1,$2,$3,$4,'revoked')",
  [recruiter.id,a.id,job.id,application.id]));
 process.stdout.write("DB09 registered recruiter private notes PASSED: "+count+" checks (rolled back)\n");
}finally{try{await db.query("ROLLBACK");}finally{await db.end();}}
