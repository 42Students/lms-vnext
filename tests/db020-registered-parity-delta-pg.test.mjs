import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if(process.env.DB020_DISPOSABLE_PG!=="1")
  throw new Error("DB020 parity delta requires disposable PG17");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const migrated=journal.entries.some(x=>x.tag==="0323_db020_registered_column_and_index_parity");

test("DB020 additive CHECK/index/default alignment is registered on real PG17",async()=>{
  assert.ok(migrated,"0323 must be in registered journal");
  const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis:10000,query_timeout:15000});
  await db.connect();
  try{
    await db.query("BEGIN READ ONLY");
    const n=Number((await db.query("select count(*)::int n from drizzle.__drizzle_migrations")).rows[0].n);
    assert.equal(n,journal.entries.length,"complete registered replay required");
    const cs=(await db.query(`
      SELECT t.relname AS table_name, c.conname, c.convalidated,
             pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public'
        AND c.contype='c' AND (c.conname='messaging_receipts_failure_summary_len_ck'
             OR c.conname='messaging_sms_attempts_summary_ck')
    `)).rows;
    assert.deepEqual(cs.map(x=>x.conname).sort(),[
       "messaging_receipts_failure_summary_len_ck",
       "messaging_sms_attempts_summary_ck"].sort());
    assert.ok(cs.every(x=>x.convalidated===true));
    assert.ok(cs.every(x=>x.definition.includes("safe_failure_summary")
      && x.definition.includes("180")));
    const ix=(await db.query(`
      SELECT t.relname AS table_name, i.relname AS name,
             x.indisvalid AS valid,pg_get_indexdef(x.indexrelid) AS definition
      FROM pg_index x JOIN pg_class t ON t.oid=x.indrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      JOIN pg_class i ON i.oid=x.indexrelid
      WHERE n.nspname='public' AND i.relname=ANY($1::text[])
    `,[["messaging_sms_attempts_command_idx","db10_bug_report_attachments_limit_idx"]])).rows;
    assert.deepEqual(ix.map(x=>x.name).sort(),[
      "messaging_sms_attempts_command_idx",
      "db10_bug_report_attachments_limit_idx"].sort());
    assert.ok(ix.every(x=>x.valid));
    assert.match(ix.find(x=>x.name==="messaging_sms_attempts_command_idx").definition,
      /\(command_id, attempted_at\)/);
    assert.match(ix.find(x=>x.name==="db10_bug_report_attachments_limit_idx").definition,
      /\(bug_report_id, id\)/);
    const defaults=(await db.query(`
      SELECT a.attname,pg_get_expr(d.adbin,d.adrelid) AS expression
      FROM pg_attribute a JOIN pg_class t ON t.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE n.nspname='public' AND t.relname='project_instances'
        AND a.attname='sprint_length_weeks'
    `)).rows;
    assert.equal(defaults.length,1);
    assert.equal(defaults[0].expression,"4");
    const source=readFileSync("src/db/schema/placement-public-page-content.ts","utf8");
    assert.match(source,/metricKeys:jsonb\("metric_keys"\)[\s\S]*?\.default\(sql`'\["PLACED", "OFFERS", "HIRING_COMPANIES"\]'::jsonb`\)/);
    await db.query("COMMIT");
  }finally{
    await db.query("ROLLBACK").catch(()=>{});
    await db.end();
  }
});
