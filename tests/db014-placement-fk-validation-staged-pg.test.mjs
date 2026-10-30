// DB014 acceptance candidate witness: validate both old NOT VALID placement
// parent FKs in a disposable transaction, roll back DDL, never claim promotion.
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if(process.env.DB014_STAGED_PG!=="YES")
  throw new Error("DB014 requires explicit isolated registered PG17 target");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const candidate=readFileSync("docs/planning/sql/db014-placement-fk-validation-candidate.sql","utf8");
const required=[
  "placement_applications_current_round_job_fk",
  "placement_applications_role_option_job_fk",
].sort();

async function status(db){
  const {rows}=await db.query(
    "SELECT conname,convalidated FROM pg_constraint "+
    "WHERE conrelid='public.placement_applications'::regclass "+
    "AND contype='f' AND conname=ANY($1::text[]) ORDER BY conname",
    [required],
  );
  assert.deepEqual(rows.map(x=>x.conname),required);
  return rows;
}

test("DB014 both currently unvalidated application parent FKs can be validated without data changes",async()=>{
  const db=new pg.Client({
    connectionString:process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis:10000,query_timeout:20000,
  });
  await db.connect();
  let active=false;
  try{
    const before=await status(db);
    assert.ok(before.every(x=>x.convalidated===false),
      "This stage is only for known unvalidated FKs; reroute if L01 registered validation");
    await db.query("BEGIN");
    active=true;
    await db.query(candidate);
    const after=await status(db);
    assert.ok(after.every(x=>x.convalidated===true),
      "Both role-option and current-round FKs must validate together");
    await db.query("ROLLBACK");
    active=false;
    assert.deepEqual(await status(db),before,
      "Rollback-only verification must not promote candidate DDL");
    console.log(JSON.stringify({
      type:"DB014_STAGED_PLACEMENT_FK_VALIDATION",
      sourceConstraints:required,
      validationPassed:true,
      registeredMigrationApplied:false,
      promoted:false,
    }));
  }finally{
    if(active)await db.query("ROLLBACK").catch(()=>{});
    await db.end();
  }
});
