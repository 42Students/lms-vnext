#!/usr/bin/env node
// Read-only PostgreSQL replay catalog proof for DB-002. Does NOT prove full domain parity.
import {readFileSync} from "node:fs";
import pg from "pg";
import {assertSafeDb01TestTarget} from "./db01-test-database-guard.mjs";
export const requiredTables=["organizations","colleges","users","college_memberships","courses","course_section_deliveries","quiz_attempts","assignment_submissions"];
export function validateTarget(raw, env=process.env){
 if(!raw)throw Error("TEST_DATABASE_URL required");
 const target=assertSafeDb01TestTarget({
  TEST_DATABASE_URL:raw,
  DB01_REMOTE_TEST_DATABASE_CONFIRM:env.DB01_REMOTE_TEST_DATABASE_CONFIRM,
 });
 return target.database;
}
export function assess({expected,migrations,version,tables,foreignKeys,checks,uniques,indexes,missing}){
 const errors=[];
 if(!(version>=170000&&version<180000))errors.push("WRONG_POSTGRES_VERSION");
 if(expected<43 || migrations!==expected)errors.push("MIGRATION_REPLAY_MISMATCH");
 if(tables<30)errors.push("TOO_FEW_PUBLIC_TABLES");
 if(foreignKeys<10)errors.push("FK_CATALOG_INCOMPLETE");
 if(checks<1)errors.push("MISSING_CHECK_CONSTRAINTS");
 if(uniques<1)errors.push("MISSING_UNIQUE_CONSTRAINTS");
 if(indexes<30)errors.push("INDEX_CATALOG_INCOMPLETE");
 if(missing.length)errors.push("REQUIRED_TABLES_MISSING");
 return {pass:errors.length===0,errors};
}
export async function main(){
 const database=validateTarget(process.env.TEST_DATABASE_URL);
 const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
 const expected=journal.entries?.length;
 if(!Number.isSafeInteger(expected)||expected<43)throw Error("Registered migration journal invalid");
 const c=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:15000});
 await c.connect();
 try{
  await c.query("BEGIN READ ONLY");
  const n=async(sql)=>Number((await c.query(sql)).rows[0].n);
  const version=Number((await c.query("SELECT current_setting('server_version_num') AS v")).rows[0].v);
  const migrations=await n("SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations");
  const tables=await n("SELECT count(*)::int AS n FROM pg_class r JOIN pg_namespace ns ON ns.oid=r.relnamespace WHERE ns.nspname='public' AND r.relkind='r'");
  const constraints=async(kind)=>n("SELECT count(*)::int AS n FROM pg_constraint co JOIN pg_class r ON r.oid=co.conrelid JOIN pg_namespace ns ON ns.oid=r.relnamespace WHERE ns.nspname='public' AND co.contype "+kind);
  const foreignKeys=await constraints("='f'");
  const checks=await constraints("='c'");
  const uniques=await constraints("IN ('u','p')");
  const indexes=await n("SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname='public'");
  const missing=[];
  for(const table of requiredTables)if(!(await c.query("SELECT to_regclass($1) AS r",["public."+table])).rows[0].r)missing.push(table);
  const counts={expected,migrations,version,tables,foreignKeys,checks,uniques,indexes,missing};
  const verdict=assess(counts);
  console.log(JSON.stringify({type:"DB002_EXECUTED_REGISTERED_JOURNAL_CATALOG_ONLY",gitSha:process.env.GITHUB_SHA??null,database,...counts,verdict,unregisteredSchemaDriftAccepted:false,domainParityCertified:false},null,2));
  if(!verdict.pass)process.exitCode=2;
  await c.query("COMMIT");
 }finally{await c.end()}
}
if(process.argv[1]?.endsWith("/db002-postgres-catalog-acceptance.mjs"))main().catch(e=>{console.error(e);process.exitCode=1});
