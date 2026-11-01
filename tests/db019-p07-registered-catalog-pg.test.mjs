import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";

if(process.env.DB19_P07_REGISTERED_PG!=="YES")
  throw new Error("P07 registered catalog evidence needs explicit isolated PG17 gate");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const review=JSON.parse(readFileSync("docs/planning/db019-p07-group-elective-field-decisions.json","utf8"));

test("DB19-P07 registered PG17 has physical columns for 79 frozen field decisions and active unique index",async()=>{
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:15000});
 await db.connect();
 try{
   const version=Number((await db.query("show server_version_num")).rows[0].server_version_num);
   assert.ok(version>=170000&&version<180000,"PostgreSQL 17 exact evidence required");
   assert.equal(review.sourceSha,"21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
   assert.equal(review.fieldDecisions.length,79);
   const physical=new Set((await db.query(
     "SELECT table_name,column_name FROM information_schema.columns "+
     "WHERE table_schema='public' AND table_name = ANY($1::text[])",
     [["elective_offerings","elective_slots","lms_groups","lms_group_members",
       "lms_group_member_events","lms_group_rules"]]
   )).rows.map(row=>row.table_name+"."+row.column_name));
   let checked=0;
   for(const field of review.fieldDecisions){
     for(const target of field.targetRefs){
       if(target==="elective_offerings_slot_active_course_uq")continue;
       assert.match(target,/^[a-z_]+\.[a-z_]+$/,"Do not execute unsafe or invented target refs");
       assert.ok(physical.has(target),field.sourceField+" unresolved registered target "+target);
       checked++;
     }
   }
   assert.equal(review.fieldDecisions.length,79);
   assert.ok(checked>=78,"Registered physical column matches were not executed");
   const idx=await db.query(
     "SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='elective_offerings' "+
     "AND indexname='elective_offerings_slot_active_course_uq'");
   assert.equal(idx.rows.length,1,"active slot/course key index must exist in registered PG17");
   assert.match(idx.rows[0].indexdef,/CREATE UNIQUE INDEX/i);
   assert.match(idx.rows[0].indexdef,/slot_id.*course_id/i);
   assert.match(idx.rows[0].indexdef,/WHERE/i);
   assert.match(idx.rows[0].indexdef,/status/i);
   assert.match(idx.rows[0].indexdef,/deleted_at/i);
   const fk=await db.query(
     "SELECT conname FROM pg_constraint WHERE contype='f' "+
     "AND conname IN ('elective_offerings_backed_class_group_fk') ");
   assert.deepEqual(fk.rows.map(x=>x.conname),["elective_offerings_backed_class_group_fk"]);
 }finally{await db.end();}
});
