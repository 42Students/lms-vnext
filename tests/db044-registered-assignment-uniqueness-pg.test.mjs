import {after,test} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {assertSafeDb01TestTarget} from "../scripts/db01-test-database-guard.mjs";

if(process.env.DB044_REGISTERED_PG !== "YES" || !process.env.TEST_DATABASE_URL)
  throw new Error("DB044 requires explicit disposable registered PostgreSQL acceptance");
assertSafeDb01TestTarget({...process.env,DATABASE_URL:""});
const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
after(async()=>pool.end());

test("DB044 registered one-submission unique index is exact and excludes dormant attempt/semester",async()=>{
 const {rows}=await pool.query(
  "select i.indisunique, i.indisvalid, i.indisready, i.indpred is null as not_partial, " +
  "pg_get_indexdef(i.indexrelid) as ddl, pg_get_indexdef(i.indexrelid,1,true) as first_col, " +
  "pg_get_indexdef(i.indexrelid,2,true) as second_col " +
  "from pg_index i join pg_class idx on idx.oid=i.indexrelid " +
  "join pg_class t on t.oid=i.indrelid " +
  "where t.relname='assignment_submissions' " +
  "and idx.relname='assignment_submissions_assignment_membership_uq'"
 );
 assert.equal(rows.length,1,"Registered migration must create the real unique index");
 const row=rows[0];
 assert.equal(row.indisunique,true);
 assert.equal(row.indisvalid,true);
 assert.equal(row.indisready,true);
 assert.equal(row.not_partial,true,"Soft-deleted/old attempts must not bypass current one-submission identity");
 assert.equal(row.first_col,"assignment_id");
 assert.equal(row.second_col,"membership_id");
 assert.doesNotMatch(row.ddl,/attempt_number|semester_number/i);
});
test("DB044 physical compatibility data cannot become a resubmission identity key",async()=>{
 const {rows}=await pool.query(
   "select column_name,column_default from information_schema.columns " +
   "where table_schema=current_schema() and table_name='assignment_submissions' " +
   "and column_name in ('attempt_number','semester_number') order by column_name"
 );
 assert.equal(rows.length,2);
 const attempt=rows.find(x=>x.column_name==="attempt_number");
 assert.match(attempt.column_default,/1/);
 const unique=await pool.query(
   "select indexname,indexdef from pg_indexes where schemaname=current_schema() " +
   "and tablename='assignment_submissions' and indexdef ilike '%UNIQUE%'"
 );
 assert.ok(unique.rows.some(x=>x.indexname==="assignment_submissions_assignment_membership_uq"));
});
