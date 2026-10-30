// Exact registered-PG17 column witness. Never touches production data.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";

if(process.env.DB014_STAGED_PG!=="YES")
 throw new Error("DB020 provenance witness requires explicitly disposable PostgreSQL");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));

test("DB020 registered 0319 grade-event source_action exists with exact 120-char nullable contract",async()=>{
 assert.ok(journal.entries.some(x=>x.tag==="0319_db020_grade_event_source_action"));
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:12000});
 await db.connect();
 try{
  await db.query("BEGIN READ ONLY");
  const a=await db.query(`
    SELECT a.attname,format_type(a.atttypid,a.atttypmod) AS type,
           a.attnotnull
    FROM pg_attribute a
    JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='assignment_grade_events'
      AND a.attname='source_action' AND a.attnum>0 AND NOT a.attisdropped
  `);
  assert.equal(a.rows.length,1,"Typed grade-event source_action must exist in registered catalog");
  assert.equal(a.rows[0].type,"character varying(120)");
  assert.equal(a.rows[0].attnotnull,false,
    "Unverified historical source identity must remain nullable and not backfilled");
  const m=await db.query(
   "SELECT count(*)::int n FROM drizzle.__drizzle_migrations");
  assert.equal(Number(m.rows[0].n),journal.entries.length);
  await db.query("COMMIT");
 }finally{
  await db.query("ROLLBACK").catch(()=>{});
  await db.end();
 }
});
