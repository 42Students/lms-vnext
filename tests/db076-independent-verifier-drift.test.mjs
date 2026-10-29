import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const script=fs.readFileSync("scripts/db-independent-verify.mjs","utf8");
const catalog=fs.readFileSync("scripts/db002-postgres-catalog-acceptance.mjs","utf8");

test("DB076 independent verifier contains all ten ordered database gates",()=>{
  const labels=[
    "Migration journal integrity",
    "Canonical Drizzle generation",
    "Tracked Drizzle schema drift",
    "Untracked Drizzle schema drift",
    "Disposable database reset + zero-to-head migration + seed",
    "Migration idempotence smoke",
    "Read-only PostgreSQL migration/catalog witness",
    "DB-078 registered course-column catalog",
    "Database parity source/static contracts",
    "PostgreSQL integration / negative witnesses",
  ];
  const positions=labels.map((label)=>script.indexOf(`"${label}"`));
  assert.ok(positions.every((position)=>position>=0));
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
  assert.match(script,/results\.length === 10/);
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

test("DB076 source cleanliness gate precedes Docker and supplied PostgreSQL connections",()=>{
  const cleanAt=script.indexOf('const dirtyEntries = shellText("git"');
  const probeAt=script.indexOf("postgresVersion: providedPostgresVersion(env)");
  const dockerAt=script.indexOf("provider = await startDockerPostgres()");
  assert.ok(cleanAt>0 && probeAt>cleanAt && dockerAt>cleanAt);
  assert.match(script,/sourceTreeClean:\s*false|let sourceTreeClean = false/);
  assert.match(script,/sourceTreeClean = true/);
  assert.match(script,/passed:\s*sourceTreeClean\s*&&/);
  assert.match(script,/requires a clean tracked and untracked source tree/);
});

test("DB076 clean checkout preflight refuses tracked, staged and untracked changes",()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"db076-clean-source-"));
  const git=(...args)=>execFileSync("git",args,{cwd:dir,encoding:"utf8"});
  const status=()=>git("status","--porcelain=v1","--untracked-files=normal").trim();
  try {
    git("init","-q");
    git("config","user.name","L10 Test");
    git("config","user.email","l10@example.invalid");
    fs.writeFileSync(path.join(dir,"source.txt"),"initial\n");
    git("add","source.txt");
    git("commit","-qm","initial");
    assert.equal(status(),"");
    fs.writeFileSync(path.join(dir,"source.txt"),"unstaged\n");
    assert.notEqual(status(),"","unstaged edits must refuse");
    git("add","source.txt");
    assert.notEqual(status(),"","staged edits must refuse");
    git("reset","--hard","HEAD");
    fs.writeFileSync(path.join(dir,"untracked-sensitive-file.txt"),"not included in output");
    assert.notEqual(status(),"","untracked files must refuse");
    fs.rmSync(path.join(dir,"untracked-sensitive-file.txt"));
    assert.equal(status(),"","clean checkout can proceed");
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
