#!/usr/bin/env node
/**
 * L08 DB-056/057/063/064: real PostgreSQL checks after clean registered
 * migration replay and seed. NEVER run against production.
 * DB09_ISOLATED_TEST_DATABASE=1 TEST_DATABASE_URL=<disposable> node tests/db09-collaboration-registered-pg-acceptance.mjs
 * All writes roll back. No staged SQL is executed.
 */
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";
if(process.env.DB09_ISOLATED_TEST_DATABASE!=="1"||!process.env.TEST_DATABASE_URL)
 throw Error("DB09 requires explicit disposable PostgreSQL opt-in");
// The canonical disposable-target gate permits DATABASE_URL===TEST_DATABASE_URL
// only in the independent DB03 verifier's isolated replay environment.
assertDb018DisposableTarget({...process.env,DB018_ISOLATED_TEST_DATABASE:"1"});
const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
const suffix=process.pid+"-"+Date.now();
let seq=0,checks=0;
async function one(sql,p=[]){const r=await db.query(sql,p);if(r.rows.length!==1)throw Error("Expected one row: "+sql);return r.rows[0];}
async function deny(label,fn){
 const sp="l08_sp_"+(++seq);await db.query("SAVEPOINT "+sp);let rejected=false;
 try{await fn();}catch(e){if(e?.code!=="23514")throw Error(label+" expected SQLSTATE 23514; got "+(e?.code??e));rejected=true;}
 finally{await db.query("ROLLBACK TO SAVEPOINT "+sp);await db.query("RELEASE SAVEPOINT "+sp);}
 if(!rejected)throw Error(label+" was incorrectly allowed");checks++;
}
function same(label,actual,want){if(actual!==want)throw Error(label+": expected "+want+" got "+actual);checks++;}
await db.connect();
try{
 await db.query("BEGIN");
 const registered=await one("select to_regprocedure('db09_assert_recruiter_read_scope()') is not null as ready");
 same("registered DB09 recruiter guard",registered.ready,true);
 const ca=await one("select id from colleges where code='SEED-A'");
 const cb=await one("select id from colleges where code='SEED-B'");
 const admin=await one("select id from users where email='collegeadmin.seed@example.com'");
 const faculty=await one("select id from users where email='faculty.seed@example.com'");
 const learner=await one("select id from users where email='learner.seed@example.com'");
 const lm=await one("select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.user_id=$1 and m.college_id=$2 and m.status='ACTIVE' and r.role='LEARNER'",[learner.id,ca.id]);
 // The seeded faculty principal may legitimately receive additional roles
 // in independent fixtures. Manufacture a fresh ACTIVE FACULTY-only user to
 // prove the database rejects an ordinary college member, not an arbitrary
 // user whose effective permission set can change across test passes.
 const ordinaryFaculty=await one(
  "insert into users(identity_uid,email,display_name,platform_status) values($1,$2,'L08 ordinary faculty','ACTIVE') returning id",
  ["l08-ordinary-"+suffix,"l08-ordinary-"+suffix+"@example.com"]);
 const ordinaryMembership=await one(
  "insert into college_memberships(user_id,college_id,status) values($1,$2,'ACTIVE') returning id",
  [ordinaryFaculty.id,ca.id]);
 await db.query("insert into membership_roles(membership_id,role) values($1,'FACULTY')",[ordinaryMembership.id]);
 const ordinaryAuthority=await one(
  "select db09_has_active_tpo_actor($1::uuid,$2::uuid) as permitted",
  [ordinaryFaculty.id,ca.id]);
 same("FACULTY-only principal has no college-wide TPO authority",ordinaryAuthority.permitted,false);

 // Scoped TPO user preferences have true/false defaults and an immutable key.
 const p=await one("insert into placement_tpo_user_preferences(college_id,user_id) values($1,$2) returning morning_digest,recruiter_messages,requests,results_ready,follow_ups",[ca.id,admin.id]);
 same("digest off",p.morning_digest,false);
 for(const key of ["recruiter_messages","requests","results_ready","follow_ups"])same(key+" on",p[key],true);
 const updated=await one("update placement_tpo_user_preferences set recruiter_messages=false where college_id=$1 and user_id=$2 returning recruiter_messages,requests",[ca.id,admin.id]);
 same("disabled switch persists",updated.recruiter_messages,false);same("unmodified switch preserved",updated.requests,true);
 await deny("ordinary faculty denied TPO preferences",()=>db.query("insert into placement_tpo_user_preferences(college_id,user_id) values($1,$2)",[ca.id,ordinaryFaculty.id]));
 await deny("cross-college preference denied",()=>db.query("insert into placement_tpo_user_preferences(college_id,user_id) values($1,$2)",[cb.id,admin.id]));
 await deny("preference owner immutable",()=>db.query("update placement_tpo_user_preferences set user_id=$3 where college_id=$1 and user_id=$2",[ca.id,admin.id,ordinaryFaculty.id]));
 await deny("preference delete forbidden",()=>db.query("delete from placement_tpo_user_preferences where college_id=$1 and user_id=$2",[ca.id,admin.id]));
 const v=await one("insert into placement_tpo_saved_views(college_id,user_id,scope,name) values($1,$2,'RECRUITER_LEADS',$3) returning id",[ca.id,admin.id,"L08 "+suffix]);
 await deny("saved view rewrite forbidden",()=>db.query("update placement_tpo_saved_views set name='forged' where id=$1",[v.id]));
 // This is a create/delete-only collection. Rewriting an existing view is
 // forbidden, but owner-initiated removal is an intentional, tested flow.
 const removed=await db.query("delete from placement_tpo_saved_views where id=$1 returning id",[v.id]);
 same("saved view owner can remove view",removed.rows.length,1);
 const afterView=await db.query("select id from placement_tpo_saved_views where id=$1",[v.id]);
 same("saved view removed without tombstone",afterView.rows.length,0);
 // History can be appended only by a TPO actor about an active learner.
 const n=await one("insert into placement_tpo_student_notes(college_id,learner_membership_id,note,created_by_user_id) values($1,$2,'Valid note',$3) returning id",[ca.id,lm.id,admin.id]);
 await deny("student note rewrite forbidden",()=>db.query("update placement_tpo_student_notes set note='forged' where id=$1",[n.id]));
 await deny("student note delete forbidden",()=>db.query("delete from placement_tpo_student_notes where id=$1",[n.id]));
 await deny("ordinary faculty cannot author student notes",()=>db.query("insert into placement_tpo_student_notes(college_id,learner_membership_id,note,created_by_user_id) values($1,$2,'forged',$3)",[ca.id,lm.id,ordinaryFaculty.id]));
 // A fresh active same-company recruiter grant must be present for reads.
 const co=await one("insert into placement_companies(name,status,created_by_user_id) values($1,'ACTIVE',$2) returning id",["L08 company "+suffix,admin.id]);
 const fm=await one("select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.user_id=$1 and m.college_id=$2 and r.role='FACULTY'",[faculty.id,ca.id]);
 const rel=await one("insert into placement_company_relationships(college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id) values($1,$2,'ACTIVE',false,$3,$4) returning id",[ca.id,co.id,fm.id,admin.id]);
 const rec=await one("insert into users(identity_uid,email,display_name,platform_status) values($1,$2,'L08 recruiter','ACTIVE') returning id",["l08-"+suffix,"l08-"+suffix+"@example.com"]);
 await db.query("insert into placement_recruiter_profiles(user_id,company_id,status,created_by_user_id) values($1,$2,'ACTIVE',$3)",[rec.id,co.id,admin.id]);
 const grant=await one("insert into placement_recruiter_college_grants(recruiter_user_id,company_relationship_id,status,granted_by_user_id) values($1,$2,'ACTIVE',$3) returning id",[rec.id,rel.id,admin.id]);
 const before=await one("insert into placement_recruiter_notification_reads(recruiter_user_id,college_id,read_through) values($1,$2,statement_timestamp()-interval '1 day') returning read_through",[rec.id,ca.id]);
 const after=await one("update placement_recruiter_notification_reads set read_through=statement_timestamp() where recruiter_user_id=$1 and college_id=$2 returning read_through",[rec.id,ca.id]);
 if(after.read_through<before.read_through)throw Error("watermark regressed");checks++;
 await deny("future watermark",()=>db.query("update placement_recruiter_notification_reads set read_through=statement_timestamp()+interval '1 hour' where recruiter_user_id=$1 and college_id=$2",[rec.id,ca.id]));
 await deny("backward watermark",()=>db.query("update placement_recruiter_notification_reads set read_through=statement_timestamp()-interval '2 days' where recruiter_user_id=$1 and college_id=$2",[rec.id,ca.id]));
 await deny("cross-college marker",()=>db.query("insert into placement_recruiter_notification_reads(recruiter_user_id,college_id,read_through) values($1,$2,statement_timestamp())",[rec.id,cb.id]));
 await deny("marker identity immutable",()=>db.query("update placement_recruiter_notification_reads set college_id=$3 where recruiter_user_id=$1 and college_id=$2",[rec.id,ca.id,cb.id]));
 await db.query("update placement_recruiter_college_grants set status='REVOKED',revoked_by_user_id=$2,revoked_at=now() where id=$1",[grant.id,admin.id]);
 await deny("revoked recruiter marker",()=>db.query("update placement_recruiter_notification_reads set read_through=statement_timestamp() where recruiter_user_id=$1 and college_id=$2",[rec.id,ca.id]));
 process.stdout.write("DB09 registered collaboration checks passed: "+checks+" (rolled back)\n");
}finally{try{await db.query("ROLLBACK");}finally{await db.end();}}
