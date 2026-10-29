import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const script=fs.readFileSync("scripts/db-independent-verify.mjs","utf8");
const catalog=fs.readFileSync("scripts/db002-postgres-catalog-acceptance.mjs","utf8");

test("DB076 independent verifier contains all nine ordered database gates",()=>{
  const labels=[
    "Migration journal integrity",
    "Canonical Drizzle generation",
    "Tracked Drizzle schema drift",
    "Untracked Drizzle schema drift",
    "Disposable database reset + zero-to-head migration + seed",
    "Migration idempotence smoke",
    "Read-only PostgreSQL migration/catalog witness",
    "Database parity source/static contracts",
    "PostgreSQL integration / negative witnesses",
  ];
  const positions=labels.map((label)=>script.indexOf(`"${label}"`));
  assert.ok(positions.every((position)=>position>=0));
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
  assert.match(script,/results\.length === 9/);
});

test("DB076 generation gate checks both tracked and untracked drizzle drift",()=>{
  assert.match(
    script,
    /"Tracked Drizzle schema drift"[\s\S]*"git"[\s\S]*"diff"[\s\S]*"--exit-code"[\s\S]*"HEAD"[\s\S]*"drizzle\//,
  );
  assert.match(
    script,
    /"Untracked Drizzle schema drift"[\s\S]*"git"[\s\S]*"ls-files"[\s\S]*"--others"[\s\S]*"--exclude-standard"[\s\S]*"drizzle\//,
  );
  assert.match(script,/expectedEmptyStdout:\s*true/);
  assert.match(script,/stdoutWasEmpty/);
  assert.match(script,/found unregistered files/);
});

test("DB076 catalog gate executes after replay idempotence and before domain tests",()=>{
  const migrate=script.indexOf('"Migration idempotence smoke"');
  const catalog=script.indexOf('"Read-only PostgreSQL migration/catalog witness"');
  const staticContracts=script.indexOf('"Database parity source/static contracts"');
  const integration=script.indexOf('"PostgreSQL integration / negative witnesses"');
  assert.ok(migrate>=0);
  assert.ok(catalog>migrate);
  assert.ok(staticContracts>catalog);
  assert.ok(integration>staticContracts);
  assert.match(script,/scripts\/db002-postgres-catalog-acceptance\.mjs/);
});

test("DB076 evidence cannot pass when empty-output drift gate reported files",()=>{
  assert.match(
    script,
    /step\.expectedEmptyStdout !== true \|\| step\.stdoutWasEmpty === true/,
  );
  assert.match(script,/outputSha256/);
  assert.match(script,/gitSha = shellText\("git", \["rev-parse", "HEAD"\]\)/);
});


test("DB076 catalog target policy reuses the fail-closed DB01 disposable target guard",()=>{
  assert.match(catalog,/assertSafeDb01TestTarget/);
  assert.match(catalog,/DB01_REMOTE_TEST_DATABASE_CONFIRM/);
  assert.doesNotMatch(
    catalog,
    /DB002 catalog inspection requires a local disposable PostgreSQL URL/,
  );
});

test("DB076 catalog witness requires the newly registered 0044 DB09 tables",()=>{
  for(const table of [
    "placement_college_rules",
    "placement_company_visibility_settings",
    "placement_tpo_leads",
    "placement_tpo_lead_activities",
    "placement_tpo_followups",
  ]) assert.ok(catalog.includes(`"${table}"`),table);
});


test("DB076 guards both staged and unstaged tracked migration drift relative to HEAD",()=>{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),"db076-index-"));
  const drizzle = path.join(dir,"drizzle");
  const git = (...args) => execFileSync("git",args,{cwd:dir,encoding:"utf8",stdio:["ignore","pipe","pipe"]});
  try {
    fs.mkdirSync(drizzle);
    fs.writeFileSync(path.join(drizzle,"0001_fixture.sql"),"SELECT 1;\n");
    git("init","-q");git("config","user.name","L10 Test");git("config","user.email","l10@example.invalid");
    git("add","drizzle");git("commit","-qm","fixture");
    const args=["diff","--exit-code","HEAD","--","drizzle/"];
    assert.equal(spawnSync("git",args,{cwd:dir}).status,0,"clean fixture");
    fs.writeFileSync(path.join(drizzle,"0001_fixture.sql"),"SELECT 2;\n");
    assert.equal(spawnSync("git",args,{cwd:dir}).status,1,"unstaged drift");
    git("add","drizzle");
    assert.equal(spawnSync("git",args,{cwd:dir}).status,1,"staged drift must not pass");
    git("reset","--hard","HEAD");
    assert.equal(spawnSync("git",args,{cwd:dir}).status,0,"reverted fixture");
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
