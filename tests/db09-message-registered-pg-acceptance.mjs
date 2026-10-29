#!/usr/bin/env node
/**
 * L08 / DB-061 and DB-079: real PostgreSQL authorization, chronology,
 * immutable message history and receipt transition witness.
 * Opt-in: DB09_ISOLATED_TEST_DATABASE=1 TEST_DATABASE_URL=<disposable>
 * Only registered Drizzle migrations; every fixture write is rolled back.
 */
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";

if(process.env.DB09_ISOLATED_TEST_DATABASE!=="1"||!process.env.TEST_DATABASE_URL)
 throw Error("DB09 message acceptance needs explicit disposable DB opt-in");
assertDb018DisposableTarget({...process.env,DB018_ISOLATED_TEST_DATABASE:"1"});
const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
const suffix=process.pid+"-"+Date.now();
let count=0,seq=0;

async function one(sql,args=[]){
 const {rows}=await db.query(sql,args);
 if(rows.length!==1)throw Error("Expected one row from: "+sql);
 return rows[0];
}
async function negative(label,fn,expected="23514"){
 const savepoint="l08_m_"+(++seq);
 await db.query("SAVEPOINT "+savepoint);
 let rejected=false;
 try{await fn();}
 catch(e){
  if(e?.code!==expected)throw Error(label+" expected "+expected+" got "+(e?.code??e));
  rejected=true;
 }finally{
  await db.query("ROLLBACK TO SAVEPOINT "+savepoint);
  await db.query("RELEASE SAVEPOINT "+savepoint);
 }
 if(!rejected)throw Error(label+" incorrectly permitted");
 count++;
}
async function equal(label,actual,want){
 if(actual!==want)throw Error(label+": expected "+want+", received "+actual);
 count++;
}

await db.connect();
try{
 await db.query("BEGIN");
 const installed=await one("select to_regprocedure('db09_assert_thread_last_message_projection()') is not null as ready");
 await equal("registered thread chronology trigger",installed.ready,true);
 const college=await one("select id from colleges where code='SEED-A'");
 const admin=await one("select id from users where email='collegeadmin.seed@example.com'");
 const faculty=await one("select id from users where email='faculty.seed@example.com'");
 const owner=await one("select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.user_id=$1 and m.college_id=$2 and m.status='ACTIVE' and r.role='FACULTY'",[faculty.id,college.id]);

 // Seed identities can acquire several roles; a dedicated FACULTY-only actor
 // makes the negative independent of other tests and of old LMS role aliases.
 const ordinary=await one(
  "insert into users(identity_uid,email,display_name,platform_status) values($1,$2,'L08 ordinary messenger','ACTIVE') returning id",
  ["l08-m-f-"+suffix,"l08-m-f-"+suffix+"@example.org"]);
 const ordinaryMember=await one(
  "insert into college_memberships(user_id,college_id,status) values($1,$2,'ACTIVE') returning id",
  [ordinary.id,college.id]);
 await db.query("insert into membership_roles(membership_id,role) values($1,'FACULTY')",[ordinaryMember.id]);
 const actorScope=await one("select db09_has_active_tpo_actor($1::uuid,$2::uuid) as allowed",
  [ordinary.id,college.id]);
 await equal("ordinary faculty has no TPO authorization",actorScope.allowed,false);

 const co=await one("insert into placement_companies(name,status,created_by_user_id) values($1,'ACTIVE',$2) returning id",
  ["L08 DB061 "+suffix,admin.id]);
 const rel=await one(
  "insert into placement_company_relationships(college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id) values($1,$2,'ACTIVE',false,$3,$4) returning id",
  [college.id,co.id,owner.id,admin.id]);
 const recruiter=await one(
  "insert into users(identity_uid,email,display_name,platform_status) values($1,$2,'L08 message recruiter','ACTIVE') returning id",
  ["l08-m-r-"+suffix,"l08-m-r-"+suffix+"@example.org"]);
 await db.query("insert into placement_recruiter_profiles(user_id,company_id,status,created_by_user_id) values($1,$2,'ACTIVE',$3)",
  [recruiter.id,co.id,admin.id]);
 const grant=await one(
  "insert into placement_recruiter_college_grants(recruiter_user_id,company_relationship_id,status,granted_by_user_id,valid_until) values($1,$2,'ACTIVE',$3,now()+interval '30 days') returning id",
  [recruiter.id,rel.id,admin.id]);

 await negative("ungranted thread recruiter",()=>db.query(
  "insert into placement_tpo_message_threads(college_id,recruiter_user_id) values($1,$2)",
  [college.id,ordinary.id]));
 const thread=await one(
  "insert into placement_tpo_message_threads(college_id,recruiter_user_id) values($1,$2) returning id,last_message_at",
  [college.id,recruiter.id]);
 await equal("empty thread has no fabricated chronology",thread.last_message_at,null);
 const first=await one(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body) values($1,'TPO',$2,'Welcome') returning id,created_at",
  [thread.id,admin.id]);
 // Deferred checks must fail if a client forgets to project the message time.
 await negative("message without last-message projection",()=>db.query("SET CONSTRAINTS ALL IMMEDIATE"));
 await db.query("update placement_tpo_message_threads set last_message_at=$2 where id=$1",
  [thread.id,first.created_at]);
 await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 await db.query("SET CONSTRAINTS ALL DEFERRED");
 count++;

 await negative("falsified thread last_message_at",async()=>{
  await db.query("update placement_tpo_message_threads set last_message_at=statement_timestamp()+interval '1 hour' where id=$1",[thread.id]);
  await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 });
 await negative("recruiter impersonation",()=>db.query(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body) values($1,'RECRUITER',$2,'forged')",
  [thread.id,admin.id]));
 await negative("faculty cannot impersonate TPO",()=>db.query(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body) values($1,'TPO',$2,'forged')",
  [thread.id,ordinary.id]));
 await negative("new messages cannot already be read",()=>db.query(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body,read_at) values($1,'RECRUITER',$2,'forged',statement_timestamp())",
  [thread.id,recruiter.id]));
 await negative("future-dated message",()=>db.query(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body,created_at) values($1,'RECRUITER',$2,'future',statement_timestamp()+interval '1 day')",
  [thread.id,recruiter.id]));

 const second=await one(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body,created_at) values($1,'RECRUITER',$2,'Reply',statement_timestamp()) returning id,created_at",
  [thread.id,recruiter.id]);
 await db.query("update placement_tpo_message_threads set last_message_at=(select max(created_at) from placement_tpo_messages where thread_id=$1) where id=$1",
  [thread.id]);
 await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 await db.query("SET CONSTRAINTS ALL DEFERRED");
 count++;

 await negative("message body immutable",()=>db.query(
  "update placement_tpo_messages set body='rewritten' where id=$1",[first.id]));
 await negative("message sender immutable",()=>db.query(
  "update placement_tpo_messages set sender_user_id=$2 where id=$1",[first.id,recruiter.id]));
 await negative("message delete forbidden",()=>db.query("delete from placement_tpo_messages where id=$1",[first.id]));
 await negative("thread recruiter identity immutable",()=>db.query(
  "update placement_tpo_message_threads set recruiter_user_id=$2 where id=$1",[thread.id,ordinary.id]));
 await negative("thread deletion forbidden",()=>db.query(
  "delete from placement_tpo_message_threads where id=$1",[thread.id]));
 await negative("message cannot be read before created_at",()=>db.query(
  "update placement_tpo_messages set read_at=created_at-interval '1 second' where id=$1",[second.id]));
 const read=await one(
  "update placement_tpo_messages set read_at=statement_timestamp() where id=$1 returning read_at",
  [second.id]);
 if(!(read.read_at instanceof Date))throw Error("Valid read receipt was not persisted");
 count++;
 await negative("read receipt cannot be cleared",()=>db.query(
  "update placement_tpo_messages set read_at=null where id=$1",[second.id]));
 await negative("read receipt cannot regress",()=>db.query(
  "update placement_tpo_messages set read_at=created_at where id=$1",[second.id]));

 await db.query("update placement_recruiter_college_grants set status='REVOKED',revoked_by_user_id=$2,revoked_at=statement_timestamp() where id=$1",
  [grant.id,admin.id]);
 await negative("revoked recruiter cannot send",()=>db.query(
  "insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body) values($1,'RECRUITER',$2,'after revoke')",
  [thread.id,recruiter.id]));
 process.stdout.write("DB09 registered message chronology, read and principal checks PASSED: "+count+" (rolled back)\n");
}finally{
 try{await db.query("ROLLBACK");}finally{await db.end();}
}
