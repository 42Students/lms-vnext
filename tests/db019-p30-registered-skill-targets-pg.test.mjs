import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import pg from "pg";
import {assertDb018DisposableTarget} from "./support/db018-test-target.mjs";

if(process.env.DB19_P30_REGISTERED_PG!=="YES")
  throw new Error("P30 requires explicit disposable registered PostgreSQL17");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const ledger=JSON.parse(fs.readFileSync(
  "docs/planning/db019-p30-skill-field-decisions.json","utf8"));

test("P30 live PG17 has the physical schema for all 15 source fields and preserves independent counters",async()=>{
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:18000});
 await db.connect();
 try{
  const num=Number((await db.query("show server_version_num")).rows[0].server_version_num);
  assert.ok(num>=170000&&num<180000,"PG17 only");
  assert.equal(ledger.sourceFieldCount,15);
  assert.equal(ledger.fieldDecisions.length,15);
  const cols=(await db.query(
   "select table_name,column_name,data_type,is_nullable,column_default "+
   "from information_schema.columns where table_schema='public' "+
   "and table_name = any($1::text[])",
   [["skills","skill_synonyms","skill_usage"]]
  )).rows;
  const physical=new Map(cols.map(c=>[c.table_name+"."+c.column_name,c]));
  for(const field of ledger.fieldDecisions){
   for(const ref of field.targetRefs)
    assert.ok(physical.has(ref),field.sourceField+" has no registered physical target "+ref);
  }
  const count=(await db.query(
   "select table_name,count(*)::integer as n from information_schema.columns "+
   "where table_schema='public' and table_name=any($1::text[]) group by table_name",
   [["skills","skill_synonyms","skill_usage"]]
  )).rows;
  assert.equal(count.length,3,"registered migrations must create all three live tables");
  for(const ref of ["skills.usage_count","skill_usage.usage_count","skill_usage.last_used"]){
   assert.equal(physical.get(ref)?.is_nullable,"NO",ref);
  }
  assert.equal(physical.get("skill_usage.last_used")?.data_type,"timestamp with time zone");
  const indexes=(await db.query(
   "select tablename,indexname,indexdef from pg_indexes where schemaname='public' "+
   "and tablename=any($1::text[])",
   [["skills","skill_synonyms","skill_usage"]]
  )).rows;
  const indexByName=new Map(indexes.map(row=>[row.indexname,row]));
  for(const key of ["db10_skills_name_uq","db10_skills_legacy_id_uq",
    "db10_skill_synonyms_legacy_id_uq","db10_skill_synonyms_search_idx"])
    assert.ok(indexByName.has(key),"registered unique/source lookup index missing "+key);
  assert.match(indexByName.get("db10_skills_name_uq").indexdef,/CREATE UNIQUE INDEX/);
  assert.match(indexByName.get("db10_skill_synonyms_search_idx").indexdef,/CREATE INDEX/);
  assert.doesNotMatch(indexByName.get("db10_skill_synonyms_search_idx").indexdef,/UNIQUE/);
  const fk=(await db.query(
   "select conname,pg_get_constraintdef(oid) as def from pg_constraint "+
   "where conrelid='public.skill_synonyms'::regclass and contype='f'"
  )).rows;
  assert.ok(fk.some(row=>/skill_id/.test(row.def)&&/REFERENCES skills/.test(row.def)),
   "all synonym imports require canonical skill parent FK");
  const extra=(await db.query(
   "select count(*)::integer as n from pg_constraint "+
   "where conrelid='public.skill_usage'::regclass and contype='f'"
  )).rows[0].n;
  assert.equal(extra,0,"independent free-text usage has no mandatory catalog parent FK");
 } finally{await db.end();}
});
