// DB014 active actor grant and forged-author negative witnesses, PG17 only.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";
if(process.env.DB014_STAGED_PG!=="YES")throw Error("DB014 PG opt-in required");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const A="20000000-0000-4000-8000-000000000001";
const admin="30000000-0000-4000-8000-000000000002";
const learner="30000000-0000-4000-8000-000000000004";
const superAdmin="30000000-0000-4000-8000-000000000001";
const learnerMembership="40000000-0000-4000-8000-000000000004";
const adminMembership="40000000-0000-4000-8000-000000000001";
test("DB014 live group history rejects forged actor roles and holds actor grants",async()=>{
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:15000});
 await db.connect();let tx=false;
 try{
   const version=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
   assert.ok(version>=170000&&version<180000);
   assert.equal((await db.query(
     "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations")).rows[0].n,
     journal.entries.length);
   const guard=await db.query(
     "SELECT tgenabled FROM pg_trigger WHERE tgname=$1 AND NOT tgisinternal",
     ["db14_group_history_actor_grant_guard"]);
   assert.equal(guard.rows.length,1);
   assert.ok(["O","A"].includes(guard.rows[0].tgenabled));
   await db.query("BEGIN");tx=true;
   const group=randomUUID();
   await db.query(
     "INSERT INTO lms_groups(id,kind,owner_scope,college_id,name,created_by_user_id) "+
     "VALUES($1,'STUDY','COLLEGE',$2,$3,$4)",
     [group,A,"DB014 role history "+group,admin]);
   const eventSql="INSERT INTO lms_group_member_events "+
     "(group_id,membership_id,to_state,member_type,source,actor_type,actor_user_id) "+
     "VALUES($1,$2,'ACTIVE','LEARNER','MANUAL',$3,$4)";
   for(const [role,user] of [
     ["COLLEGE_ADMIN",admin],["SUPER_ADMIN",superAdmin],["SYSTEM",null]
   ])assert.equal((await db.query(eventSql,
     [group,learnerMembership,role,user])).rowCount,1,
     "real actor or system writer must remain accepted: "+role);
   for(const [role,user] of [
     ["COLLEGE_ADMIN",learner],["SUPER_ADMIN",admin],["FACULTY",learner]
   ]){
     await db.query("SAVEPOINT forged_actor_role");
     await assert.rejects(db.query(eventSql,
       [group,learnerMembership,role,user]),e=>{
         assert.equal(e?.code,"23514");return true;
       });
     await db.query("ROLLBACK TO SAVEPOINT forged_actor_role");
   }
   const revoker=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
     connectionTimeoutMillis:10000,query_timeout:5000});
   await revoker.connect();
   try{
     await revoker.query("BEGIN");
     await revoker.query("SET LOCAL lock_timeout='350ms'");
     await assert.rejects(revoker.query(
       "DELETE FROM membership_roles WHERE membership_id=$1 AND role='COLLEGE_ADMIN'",
       [adminMembership]),e=>{assert.equal(e?.code,"55P03");return true;});
     await revoker.query("ROLLBACK");
   }finally{
     await revoker.query("ROLLBACK").catch(()=>{});
     await revoker.end();
   }
   await db.query("ROLLBACK");tx=false;
   console.log(JSON.stringify({kind:"DB014_ACTOR_GRANT_NEGATIVES",
     accepted:["COLLEGE_ADMIN","SUPER_ADMIN","SYSTEM"],
     forbiddenRoleClaims:3,concurrentRoleRevocation:"55P03",rolledBack:true}));
 }finally{
   if(tx)await db.query("ROLLBACK").catch(()=>{});
   await db.end();
 }
});
