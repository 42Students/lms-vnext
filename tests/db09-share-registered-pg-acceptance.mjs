#!/usr/bin/env node
/**
 * L08 / DB-059 and DB-060: registered secure-share PostgreSQL lifecycle witness.
 * Clean journal replay + canonical seed required. Rollback-only; no staged SQL.
 * DB09_ISOLATED_TEST_DATABASE=1 TEST_DATABASE_URL=<disposable> node tests/db09-share-registered-pg-acceptance.mjs
 */
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";
if(process.env.DB09_ISOLATED_TEST_DATABASE!=="1"||!process.env.TEST_DATABASE_URL)
 throw Error("Explicit disposable DB09 database and opt-in required");
assertDb018DisposableTarget({...process.env,DB018_ISOLATED_TEST_DATABASE:"1"});
const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
let checks=0,seq=0;
const suffix=process.pid+"-"+Date.now();
async function one(sql,args=[]){const {rows}=await db.query(sql,args);if(rows.length!==1)throw Error("Expected one row: "+sql);return rows[0];}
async function denial(label,code,fn){
 const sp="l08_share_sp_"+(++seq);await db.query("SAVEPOINT "+sp);let rejected=false;
 try{await fn();}catch(e){if(e?.code!==code)throw Error(label+" expected "+code+" got "+(e?.code??e));rejected=true;}
 finally{await db.query("ROLLBACK TO SAVEPOINT "+sp);await db.query("RELEASE SAVEPOINT "+sp);}
 if(!rejected)throw Error(label+" unexpectedly succeeded");checks++;
}
await db.connect();
try{
 await db.query("BEGIN");
 const installed=await one("select to_regprocedure('db09_assert_share_link_event_completeness()') is not null as ready");
 if(!installed.ready)throw Error("Registered share lifecycle constraints are absent");
 checks++;
 const college=await one("select id from colleges where code='SEED-A'");
 const season=await one("select id from placement_seasons where college_id=$1 and code='SEED-2026-27-A'",[college.id]);
 const admin=await one("select id from users where email='collegeadmin.seed@example.com'");
 const faculty=await one("select id from users where email='faculty.seed@example.com'");
 const owner=await one("select m.id from college_memberships m join membership_roles r on r.membership_id=m.id where m.user_id=$1 and m.college_id=$2 and r.role='FACULTY'",[faculty.id,college.id]);
 const company=await one("insert into placement_companies(name,status,created_by_user_id) values($1,'ACTIVE',$2) returning id",["L08 secure share "+suffix,admin.id]);
 const rel=await one("insert into placement_company_relationships(college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id) values($1,$2,'ACTIVE',false,$3,$4) returning id",[college.id,company.id,owner.id,admin.id]);
 const job=await one("insert into placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id) values($1,$2,$3,$4,'DB09 secure share witness','FULL_TIME','ONSITE',$5) returning id",[college.id,season.id,rel.id,"L08 share job "+suffix,admin.id]);
 const sha="a".repeat(64);
 const link=await one("insert into placement_tpo_share_links(college_id,job_id,token_hash,recipient_email,created_by_user_id,expires_at,columns) values($1,$2,$3,$4,$5,now()+interval '7 days','[\"name\",\"resume\"]'::jsonb) returning id",[college.id,job.id,sha,"recruiter-"+suffix+"@example.com",admin.id]);
 await denial("share missing CREATED event", "23514",()=>db.query("SET CONSTRAINTS ALL IMMEDIATE"));
 const created=await one("insert into placement_tpo_share_events(share_id,action) values($1,'CREATED') returning id",[link.id]);
 await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 await db.query("SET CONSTRAINTS ALL DEFERRED");
 checks++;
 await denial("duplicate CREATED event", "23505",()=>db.query("insert into placement_tpo_share_events(share_id,action) values($1,'CREATED')",[link.id]));
 await denial("share recipient immutable", "23514",()=>db.query("update placement_tpo_share_links set recipient_email='attacker@example.com' where id=$1",[link.id]));
 await denial("share columns immutable", "23514",()=>db.query("update placement_tpo_share_links set columns='[\"name\",\"email\"]'::jsonb where id=$1",[link.id]));
 await denial("share expiry immutable", "23514",()=>db.query("update placement_tpo_share_links set expires_at=now()+interval '14 days' where id=$1",[link.id]));
 await denial("event cannot precede share creation", "23514",async()=>{
   await db.query("insert into placement_tpo_share_events(share_id,action,created_at) values($1,'OPENED',now()-interval '1 day')",[link.id]);
   await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 });
 await denial("REVOKED event requires revoked link", "23514",async()=>{
   await db.query("insert into placement_tpo_share_events(share_id,action) values($1,'REVOKED')",[link.id]);
   await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 });
 await denial("event history update immutable", "23514",()=>db.query("update placement_tpo_share_events set detail='rewrite' where id=$1",[created.id]));
 await denial("event history delete immutable", "23514",()=>db.query("delete from placement_tpo_share_events where id=$1",[created.id]));
 // The single allowed disclosure-adjacent write is a live email code rotation.
 await db.query("update placement_tpo_share_links set email_code_hash=$2,email_code_expires_at=now()+interval '2 hours' where id=$1",[link.id,"b".repeat(64)]);
 checks++;
 // Revocation is a distinct, one-way transition and requires a terminal event.
 await db.query("update placement_tpo_share_links set revoked_at=clock_timestamp() where id=$1",[link.id]);
 await denial("revocation missing terminal event", "23514",()=>db.query("SET CONSTRAINTS ALL IMMEDIATE"));
 await db.query("insert into placement_tpo_share_events(share_id,action,created_at) values($1,'REVOKED',clock_timestamp())",[link.id]);
 await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 await db.query("SET CONSTRAINTS ALL DEFERRED");
 checks++;
 await denial("revocation cannot be undone", "23514",()=>db.query("update placement_tpo_share_links set revoked_at=null where id=$1",[link.id]));
 await denial("code cannot rotate after revocation", "23514",()=>db.query("update placement_tpo_share_links set email_code_hash=$2,email_code_expires_at=now()+interval '3 hours' where id=$1",[link.id,"c".repeat(64)]));
 await denial("post-revocation download forbidden", "23514",async()=>{
   await db.query("insert into placement_tpo_share_events(share_id,action,created_at) values($1,'DOWNLOADED_LIST',clock_timestamp())",[link.id]);
   await db.query("SET CONSTRAINTS ALL IMMEDIATE");
 });
 await denial("faculty cannot author a secure share", "23514",()=>db.query("insert into placement_tpo_share_links(college_id,job_id,token_hash,recipient_email,created_by_user_id,expires_at) values($1,$2,$3,$4,$5,now()+interval '7 days')",[college.id,job.id,"d".repeat(64),"other@example.com",faculty.id]));
 process.stdout.write("DB09 registered share lifecycle: "+checks+" PostgreSQL checks passed (rolled back)\n");
}finally{try{await db.query("ROLLBACK");}finally{await db.end();}}
