import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const script=fs.readFileSync("scripts/db-independent-verify.mjs","utf8");

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
    /"Tracked Drizzle schema drift"[\s\S]*"git"[\s\S]*"diff"[\s\S]*"--exit-code"[\s\S]*"drizzle\//,
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
