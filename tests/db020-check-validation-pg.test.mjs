// DB020: validate every formerly NOT VALID PostgreSQL CHECK after exact journal replay.
// No production DB target, no data modification, no semantic retirement waiver.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";

if(process.env.DB020_DISPOSABLE_PG!=="1")
 throw new Error("DB020 CHECK validation requires explicit disposable PostgreSQL");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const tag="0326_db020_validate_registered_checks";
const expected=[
 ["identity_auth_attempts","identity_auth_attempts_superseded_ck",/superseded_at/],
 ["placement_drive_change_requests","placement_drive_changes_accepted_receipt_ck",/applied_at/],
 ["placement_eligibility_decisions","placement_eligibility_decisions_note_length_ck",/note/],
 ["placement_eligibility_decisions","placement_eligibility_decisions_reason_length_ck",/reason/],
 ["project_instances","project_instances_title_length_ck",/title/],
];

test("DB020 real PG17 validates five historical NOT VALID CHECKs without deleting data",async()=>{
 assert.ok(journal.entries.some(x=>x.tag===tag),"forward-only 0326 must be registered");
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
  connectionTimeoutMillis:10000,query_timeout:20000});
 await db.connect();
 try{
  await db.query("BEGIN READ ONLY");
  const v=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
  assert.ok(v>=170000&&v<180000,"requires PostgreSQL 17");
  const migrated=Number((await db.query(
   "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations")).rows[0].n);
  assert.equal(migrated,journal.entries.length,"requires exact zero-to-head journal replay");
  const rows=(await db.query(`
   SELECT t.relname AS table_name,c.conname AS name,c.convalidated AS validated,
          pg_get_constraintdef(c.oid,true) AS definition
   FROM pg_constraint c
   JOIN pg_class t ON t.oid=c.conrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
   WHERE n.nspname='public' AND c.contype='c'`)).rows;
  const byKey=new Map(rows.map(x=>[x.table_name+"."+x.name,x]));
  for(const [table,name,shape] of expected){
   const found=byKey.get(table+"."+name);
   assert.ok(found,table+"."+name+" missing");
   assert.equal(found.validated,true,table+"."+name+" is still NOT VALID");
   assert.match(found.definition,shape,"CHECK expression changed unexpectedly");
  }
  const unvalidated=rows.filter(x=>x.validated!==true);
  assert.deepEqual(unvalidated.map(x=>x.table_name+"."+x.name).sort(),[],
   "no unvalidated public CHECK may be hidden by DB020 certification");
  await db.query("COMMIT");
 }finally{
  await db.query("ROLLBACK").catch(()=>{});
  await db.end();
 }
});
