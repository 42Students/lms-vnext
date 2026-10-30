import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectCanonicalGenerationOutput } from "../scripts/db-independent-verifier-generation-guard.mjs";

test("DB076 accepts a clean and silent generator, but rejects zero-exit fatal output", () => {
  assert.deepEqual(inspectCanonicalGenerationOutput({stdout: "No schema changes", stderr: ""}),
    {stderrWasEmpty:true,fatalOutputDetected:false,passed:true});
  assert.deepEqual(inspectCanonicalGenerationOutput({
    stdout:"Reading config file",
    stderr:"TypeError: Do not know how to serialize a BigInt\n    at diffSchemasOrTables (drizzle-kit/bin.cjs:22188:27)",
  }),{stderrWasEmpty:false,fatalOutputDetected:true,passed:false});
  assert.equal(inspectCanonicalGenerationOutput({stdout:"TypeError: BigInt serialization failed"}).passed,false);
  assert.equal(inspectCanonicalGenerationOutput({stderr:"Warning: generator result unverified"}).passed,false);
  assert.equal(inspectCanonicalGenerationOutput({stdout:"UnhandledPromiseRejection: generator crashed"}).passed,false);
  assert.deepEqual(inspectCanonicalGenerationOutput({
    stdout:"drizzle/meta/0316_snapshot.json data is malformed",stderr:"",
  }),{stderrWasEmpty:true,fatalOutputDetected:true,passed:false});
  assert.equal(inspectCanonicalGenerationOutput({stdout:"error-free schema"}).passed,true);
});

test("DB076 zero-exit BigInt generator aborts before DB reset with failing evidence", () => {
  const root=mkdtempSync(path.join(os.tmpdir(),"lms-db076-zero-exit-"));
  const checkout=path.join(root,"checkout");
  const bin=path.join(root,"bin");
  const receiptPath=path.join(root,"evidence.json");
  const resetMarker=path.join(root,"unexpected-reset");
  try {
    mkdirSync(path.join(checkout,"scripts"),{recursive:true});mkdirSync(bin);
    for(const filename of ["db-independent-verify.mjs","db01-test-database-guard.mjs",
      "db-independent-verifier-redaction.mjs","db-independent-verifier-generation-guard.mjs"]){
      copyFileSync(path.join("scripts",filename),path.join(checkout,"scripts",filename));
    }
    const git=(...args)=>execFileSync("git",args,{cwd:checkout,encoding:"utf8"});
    git("init","-q");git("config","user.name","L10 witness");
    git("config","user.email","l10-witness@example.invalid");
    git("add","scripts");git("commit","-qm","fixture");
    const npmScript=[
      "#!/bin/sh",
      'if [ "$1" = "--version" ]; then echo "11.0.0"; exit 0; fi',
      'if [ "$1" = "run" ] && [ "$2" = "db:journal:verify" ]; then echo "journal verified"; exit 0; fi',
      'if [ "$1" = "run" ] && [ "$2" = "db:generate" ]; then',
      '  echo "No config path provided, using default drizzle.config.ts"',
      '  echo "TypeError: Do not know how to serialize a BigInt" >&2',
      '  echo "    at diffSchemasOrTables (drizzle-kit/bin.cjs:22188:27)" >&2',
      '  exit 0',
      'fi',
      'touch "$FAKE_RESET_MARKER"',
      'exit 42',
    ].join("\n")+"\n";
    const dockerScript=[
      "#!/bin/sh",
      'case "$1" in',
      '  version) echo "25.0.0"; exit 0;;',
      '  run) echo "fake-container"; exit 0;;',
      '  exec) if [ "$3" = "pg_isready" ]; then exit 0; fi; echo "postgres (PostgreSQL) 17.0"; exit 0;;',
      '  rm) exit 0;;',
      'esac',
      'exit 42',
    ].join("\n")+"\n";
    writeFileSync(path.join(bin,"npm"),npmScript);writeFileSync(path.join(bin,"docker"),dockerScript);
    chmodSync(path.join(bin,"npm"),0o755);chmodSync(path.join(bin,"docker"),0o755);
    const result=spawnSync(process.execPath,["scripts/db-independent-verify.mjs"],{
      cwd:checkout,encoding:"utf8",env:{
        ...process.env,PATH:bin+path.delimiter+process.env.PATH,
        TEST_DATABASE_URL:"",DATABASE_URL:"",DB_VERIFY_EVIDENCE_PATH:receiptPath,
        FAKE_RESET_MARKER:resetMarker,
      },
    });
    assert.notEqual(result.status,0);
    assert.match(result.stderr??"",/Canonical Drizzle generation emitted diagnostics/);
    assert.doesNotMatch(result.stderr??"",/ERR_MODULE_NOT_FOUND/);
    assert.equal(existsSync(resetMarker),false,"no destructive reset after generator exception");
    const evidence=JSON.parse(readFileSync(receiptPath,"utf8"));
    assert.equal(evidence.passed,false);
    assert.equal(evidence.sourceTreeClean,true);
    assert.equal(evidence.steps.length,2);
    assert.equal(evidence.steps[0].name,"Migration journal integrity");
    assert.equal(evidence.steps[1].name,"Canonical Drizzle generation");
    assert.equal(evidence.steps[1].exitCode,0,"witness zero-exit fatal error");
    assert.deepEqual(evidence.steps[1].canonicalGeneration,
      {stderrWasEmpty:false,fatalOutputDetected:true,passed:false});
    assert.match(evidence.steps[1].outputTail,/TypeError: Do not know how to serialize a BigInt/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
