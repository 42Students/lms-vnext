import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectTracker, inspectCheckout, PHASES, CORE_ELEVEN } from '../scripts/tracker.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const actual = JSON.parse(fs.readFileSync(path.join(root,'docs/tracker.json'),'utf8'));
const clone = x => structuredClone(x);
const bad = (data,code) => inspectTracker(data).errors.some(e=>e.code===code);
const accepted = (id, extras={}) => ({
  id, title:'Test task', phase:'DATABASE',done:true,dependsOn:[],
  acceptedAt:'2026-10-12T00:00:00Z',
  acceptanceEvidence:[{kind:'EXECUTED',commitSha:'a'.repeat(40),exitCode:0,
    result:'PASS',runner:'disposable Node',commands:['node --test']}],
  ...extras,
});

test('sole tracker validates exactly the original 81 tasks and the original core 11',()=>{
  const x=inspectTracker(actual);
  assert.deepEqual(x.errors,[]);
  assert.deepEqual(x.counts,{total:81,done:5,notDone:76});
  assert.deepEqual(x.core,{total:11,done:3,notDone:8});
  assert.equal(x.activePhase,'DATABASE');
  assert.equal(x.readyForNextPhase,false);
});
test('each task exposes ONLY a binary completion status',()=>{
  assert.ok(actual.tasks.every(t=>typeof t.done==='boolean'));
  assert.ok(actual.tasks.every(t=>!Object.hasOwn(t,'status')));
  assert.ok(actual.tasks.every(t=>!Object.hasOwn(t,'pickedBy')&&!Object.hasOwn(t,'completedBy')));
});
test('previously implemented but unaccepted DB004 and DB005 remain NOT DONE',()=>{
  assert.equal(actual.tasks.find(t=>t.id==='DB-004').done,false);
  assert.equal(actual.tasks.find(t=>t.id==='DB-005').done,false);
});
test('task evidence is required for DONE',()=>{
  const x=clone(actual); x.tasks.find(t=>t.id==='DB-002').acceptanceEvidence=[];
  assert.ok(bad(x,'DONE_WITHOUT_EVIDENCE'));
});
test('written source is not executed acceptance',()=>{
  const x=clone(actual); const row=x.tasks.find(t=>t.id==='DB-004');
  row.done=true; row.acceptedAt='2026-10-12T00:00:00Z';
  row.acceptanceEvidence=[{kind:'SOURCE_ONLY',commitSha:'a'.repeat(40),
    result:'PASS',exitCode:0,runner:'static',commands:['node source.mjs']}];
  assert.ok(bad(x,'DONE_WITHOUT_EXECUTED_PROOF'));
});
test('failed test command is never DONE',()=>{
  const x=clone(actual); x.tasks.find(t=>t.id==='DB-002').acceptanceEvidence
    .forEach(e=>e.exitCode=1);
  assert.ok(bad(x,'DONE_WITHOUT_EXECUTED_PROOF'));
});
test('invalid or nonboolean states fail closed',()=>{
  const x=clone(actual); x.tasks.find(t=>t.id==='DB-004').done='COMPLETED';
  assert.ok(bad(x,'NON_BOOLEAN_STATUS'));
});
test('duplicate and missing task dependencies are rejected',()=>{
  const x=clone(actual); x.tasks.push(clone(x.tasks[0]));
  assert.ok(bad(x,'DUPLICATE_OR_INVALID_TASK_ID'));
  x.tasks.pop(); x.tasks[0].dependsOn=['DB-999'];
  assert.ok(bad(x,'UNKNOWN_DEPENDENCY'));
});
test('self and transitive dependency cycles are rejected',()=>{
  const x=clone(actual); const a=x.tasks[0],b=x.tasks[1];
  a.dependsOn=[a.id]; assert.ok(bad(x,'SELF_DEPENDENCY'));
  a.dependsOn=[b.id]; b.dependsOn=[a.id];
  assert.ok(bad(x,'DEPENDENCY_CYCLE'));
});
test('the original eleven denominator cannot be silently changed',()=>{
  const x=clone(actual); x.coreEleven=['DB-002'];
  assert.ok(bad(x,'CORE_ELEVEN_DRIFT'));
  assert.equal(CORE_ELEVEN.length,11);
});
test('future phases cannot be silently unlocked from the tracker alone',()=>{
  const x=clone(actual); for(const p of PHASES) x.phaseGates[p]=['gate'];
  x.tasks.forEach(t=>{t.done=true; t.acceptedAt='2026-10-12T00:00:00Z';
    t.acceptanceEvidence=accepted(t.id).acceptanceEvidence;});
  const report=inspectTracker(x);
  assert.deepEqual(report.errors,[]);
  assert.equal(report.readyForNextPhase,false);
});
test('the CLI reads one tracker and no legacy work queue or lane files',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lms-tracker-'));
  try{
    fs.mkdirSync(path.join(dir,'docs'),{recursive:true});
    fs.writeFileSync(path.join(dir,'docs/tracker.json'),JSON.stringify(actual));
    assert.deepEqual(inspectCheckout(dir).errors,[]);
    const p=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),dir,'--json'],
      {encoding:'utf8'});
    assert.equal(p.status,0,p.stderr);
    assert.deepEqual(JSON.parse(p.stdout).counts,{total:81,done:5,notDone:76});
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('CLI rejects missing tracker fail closed',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lms-tracker-'));
  try{
    const p=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),dir,'--check'],
      {encoding:'utf8'});
    assert.equal(p.status,1);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
