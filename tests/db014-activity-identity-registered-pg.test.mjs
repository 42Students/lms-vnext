// DB014 registered forward-only identity guard. Disposable PostgreSQL 17 only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if(process.env.DB014_STAGED_PG!=="YES")throw Error("DB014 PostgreSQL opt-in required");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));

test("DB014 event identity stays fixed after notification, but metadata remains writable",async()=>{
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:15000});
 await db.connect();let tx=false;
 try{
   const version=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
   assert.ok(version>=170000&&version<180000);
   assert.equal((await db.query(
     "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations")).rows[0].n,
     journal.entries.length);
   const trigger=await db.query(
     "SELECT tgenabled FROM pg_trigger WHERE tgname=$1 AND NOT tgisinternal",
     ["db14_activity_event_identity_immutable_guard"]);
   assert.equal(trigger.rows.length,1);
   assert.ok(["O","A"].includes(trigger.rows[0].tgenabled));
   await db.query("BEGIN");tx=true;
   const event=(await db.query(
     "INSERT INTO activity_events(organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) "+
     "VALUES($1,$2,$3,'IDENTITY','DB014_EVENT_IDENTITY_TEST','college',$2,'Retained identity') RETURNING id",
     ["10000000-0000-4000-8000-000000000001",
      "20000000-0000-4000-8000-000000000001",
      "30000000-0000-4000-8000-000000000002"])).rows[0].id;
   await db.query(
     "INSERT INTO in_app_notifications(user_id,event_id,title,body) VALUES($1,$2,'DB014','Receipt')",
     ["30000000-0000-4000-8000-000000000002",event]);
   for(const [query,value] of [
     ["UPDATE activity_events SET college_id=$1 WHERE id=$2",
      "20000000-0000-4000-8000-000000000002"],
     ["UPDATE activity_events SET actor_user_id=$1 WHERE id=$2",
      "30000000-0000-4000-8000-000000000003"],
     ["UPDATE activity_events SET subject_id=$1 WHERE id=$2","forged-subject"],
     ["UPDATE activity_events SET dedupe_key=$1 WHERE id=$2","forged-key"],
   ]){
     await db.query("SAVEPOINT db014_identity_negative");
     await assert.rejects(db.query(query,[value,event]),e=>{
       assert.equal(e?.code,"23514");return true;
     });
     await db.query("ROLLBACK TO SAVEPOINT db014_identity_negative");
   }
   const changed=await db.query(
     "UPDATE activity_events SET metadata=$1::jsonb WHERE id=$2 RETURNING metadata",
     [JSON.stringify({deliveryStatus:"ACCEPTED"}),event]);
   assert.equal(changed.rows[0].metadata.deliveryStatus,"ACCEPTED");
   await db.query("ROLLBACK");tx=false;
   console.log(JSON.stringify({kind:"DB014_IMMUTABLE_EVENT_IDENTITY",
     identityNegatives:4,notificationRetained:true,metadataUpdate:"PASS",rollback:true}));
 }finally{
   if(tx)await db.query("ROLLBACK").catch(()=>{});
   await db.end();
 }
});
