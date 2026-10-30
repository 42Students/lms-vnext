import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";
if(process.env.DB034_036_REGISTERED_PG!=="YES")throw Error("Explicit disposable registered PG required");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const ca="20000000-0000-4000-8000-000000000001",cb="20000000-0000-4000-8000-000000000002";
const admin="30000000-0000-4000-8000-000000000002";
const deptA="21000000-0000-4000-8000-000000000001",deptB="21000000-0000-4000-8000-000000000002";
async function withTx(fn){
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:15000});
 await db.connect();let active=false;
 try{const v=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
  assert.ok(v>=170000&&v<180000);await db.query("BEGIN");active=true;
  await fn(db);await db.query("ROLLBACK");active=false;
 }finally{if(active)await db.query("ROLLBACK").catch(()=>{});await db.end();}
}
async function denied(db,sql,params,codes=["23514","23503","42501"]){
 await db.query("SAVEPOINT denied");
 try{await assert.rejects(db.query(sql,params),error=>{
  assert.ok(codes.includes(error?.code),"expected "+codes+" got "+error?.code+" "+error?.message);return true;
 });}finally{await db.query("ROLLBACK TO SAVEPOINT denied");await db.query("RELEASE SAVEPOINT denied");}
}
const row=async(db,sql,params)=>(await db.query(sql,params)).rows[0];
test("DB034 registered trusted-domain and prep-course tenant/FK policy",async()=>{
 await withTx(async db=>{
  const suffix=randomUUID().slice(0,8),insert="INSERT INTO placement_tpo_trusted_domains(college_id,domain,created_by_user_id) VALUES($1,$2,$3)";
  await db.query(insert,[ca,"corp-"+suffix+".example.edu",admin]);
  for(const invalid of ["Gmail.com","gmail.com","@example.edu","bad_domain"," evil.edu","evil.edu "])
   await denied(db,insert,[ca,invalid,admin],["23514"]);
  await denied(db,insert,[ca,"corp-"+suffix+".example.edu",admin],["23505"]);
  await denied(db,insert,[cb,"denied-"+suffix+".edu",admin]);
  // The shared seeded faculty can hold additional placement roles in other
  // fixtures. Construct a genuine LEARNER-only principal for this SQL denial.
  const unauthorized=await row(db,"INSERT INTO users(identity_uid,display_name) VALUES($1,$2) RETURNING id",
   ["db034-learner-"+suffix,"DB034 unauthorized writer "+suffix]);
  const member=await row(db,"INSERT INTO college_memberships(user_id,college_id) VALUES($1,$2) RETURNING id",
   [unauthorized.id,ca]);
  await db.query("INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",[member.id]);
  const principal=await row(db,"SELECT db09_has_active_tpo_actor($1,$2) AS accepted",[unauthorized.id,ca]);
  assert.equal(principal.accepted,false,"a real learner principal cannot write TPO settings");
  await denied(db,insert,[ca,"denied-"+suffix+".edu",unauthorized.id]);
  const a=await row(db,"INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
   [deptA,"DB034 own "+suffix,"DB034-A-"+suffix]);
  const b=await row(db,"INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
   [deptB,"DB034 sibling "+suffix,"DB034-B-"+suffix]);
  const prep="INSERT INTO placement_tpo_prep_courses(college_id,course_id,created_by_user_id) VALUES($1,$2,$3)";
  await db.query(prep,[ca,a.id,admin]);await db.query(prep,[ca,b.id,admin]);
  await denied(db,prep,[ca,a.id,admin],["23505"]);
  // A BEFORE INSERT tenant guard may reject the orphan before the FK does. Both fail closed.
  await denied(db,prep,[ca,randomUUID(),admin],["23503","23514"]);
  const org=await row(db,"INSERT INTO organizations(name) VALUES($1) RETURNING id",["DB034 foreign "+suffix]);
  const col=await row(db,"INSERT INTO colleges(organization_id,name,code) VALUES($1,$2,$3) RETURNING id",
   [org.id,"DB034 foreign college "+suffix,"DB034-"+suffix]);
  const dep=await row(db,"INSERT INTO departments(college_id,name) VALUES($1,$2) RETURNING id",
   [col.id,"DB034 foreign department "+suffix]);
  const far=await row(db,"INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
   [dep.id,"DB034 foreign course "+suffix,"DB034-X-"+suffix]);
  await denied(db,prep,[ca,far.id,admin],["23514"]);
 });
});
test("DB034 two committed concurrent trusted-domain inserts cannot create duplicate tenant entries",async()=>{
 const suffix=randomUUID().slice(0,12),domain="race-"+suffix+".example.edu";
 const a=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:15000});
 const b=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:15000});
 await Promise.all([a.connect(),b.connect()]);
 try{
  const sql="INSERT INTO placement_tpo_trusted_domains(college_id,domain,created_by_user_id) VALUES($1,$2,$3)";
  const writes=await Promise.allSettled([
   a.query(sql,[ca,domain,admin]),
   b.query(sql,[ca,domain,admin]),
  ]);
  assert.equal(writes.filter(x=>x.status==="fulfilled").length,1);
  const failed=writes.find(x=>x.status==="rejected");
  assert.equal(failed?.status,"rejected");
  assert.equal(failed.reason?.code,"23505","duplicate trusted domain must be rejected by PK under race");
  const count=await a.query("SELECT count(*)::integer AS n FROM placement_tpo_trusted_domains WHERE college_id=$1 AND domain=$2",[ca,domain]);
  assert.equal(count.rows[0].n,1);
 }finally{
  await a.query("DELETE FROM placement_tpo_trusted_domains WHERE college_id=$1 AND domain=$2",[ca,domain]).catch(()=>{});
  await Promise.all([a.end(),b.end()]);
 }
});

test("DB036 nine registered toggles preserve defaults, durable updates and non-null",async()=>{
 await withTx(async db=>{
  const a=await row(db,"INSERT INTO placement_tpo_college_settings(college_id) VALUES($1) "+
   "RETURNING notify_drive_open_email,notify_result_applied,notify_nudges,notify_prep_assigned",[ca]);
  assert.deepEqual(Object.values(a),[true,true,true,true]);
  const b=await row(db,"INSERT INTO placement_tpo_user_preferences(college_id,user_id) VALUES($1,$2) "+
   "RETURNING morning_digest,recruiter_messages,requests,results_ready,follow_ups",[ca,admin]);
  assert.deepEqual(Object.values(b),[false,true,true,true,true]);
  const changed=await row(db,"UPDATE placement_tpo_college_settings SET notify_result_applied=false,notify_nudges=false "+
   "WHERE college_id=$1 RETURNING notify_drive_open_email,notify_result_applied,notify_nudges,notify_prep_assigned",[ca]);
  assert.deepEqual(Object.values(changed),[true,false,false,true]);
  const prefs=await row(db,"UPDATE placement_tpo_user_preferences SET morning_digest=true,recruiter_messages=false "+
   "WHERE college_id=$1 AND user_id=$2 RETURNING morning_digest,recruiter_messages,requests,results_ready,follow_ups",[ca,admin]);
  assert.deepEqual(Object.values(prefs),[true,false,true,true,true]);
  await denied(db,"UPDATE placement_tpo_user_preferences SET requests=NULL WHERE college_id=$1 AND user_id=$2",
   [ca,admin],["23502"]);
  await denied(db,"INSERT INTO placement_tpo_user_preferences(college_id,user_id) VALUES($1,$2)",
   [ca,admin],["23505"]);
 });
});
