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

test('sole tracker validates 104 tasks with dev-only UI roles while preserving original database 81 and core 11',()=>{
  const x=inspectTracker(actual);
  assert.deepEqual(x.errors,[]);
  const done = actual.tasks.filter(t => t.phase==='DATABASE'&&t.done).length;
  const coreDone = CORE_ELEVEN.filter(id => actual.tasks.find(t => t.id === id)?.done).length;
  // inspectTracker deliberately reports DB task counts; API/UI package flags
  // are tracked separately and cannot certify these database-only gates.
  assert.deepEqual(x.counts,{total:81,done,notDone:81-done});
  assert.equal(actual.tasks.length,104);
  assert.deepEqual(actual.tasks.filter(t=>!t.done).map(t=>t.id),['UI-11','UI-12','UI-13']);
  assert.equal(actual.tasks.filter(t=>t.phase==='DATABASE').length,81);
  assert.equal(actual.tasks.filter(t=>t.phase==='API').length,10);
  assert.equal(actual.tasks.filter(t=>t.phase==='UI').length,13);
  assert.equal(actual.execution.milestones.filter(m=>m.stage==='UI').length,13);
  assert.deepEqual(x.core,{total:11,done:coreDone,notDone:11-coreDone});
  assert.deepEqual(x.coreRemaining.map(t => t.id),
    CORE_ELEVEN.filter(id => !actual.tasks.find(t => t.id === id)?.done));
  assert.equal(x.activePhase,'UI');
  assert.equal(x.readyForNextPhase,false);
});
test('each task exposes ONLY a binary completion status',()=>{
  assert.ok(actual.tasks.every(t=>typeof t.done==='boolean'));
  assert.ok(actual.tasks.every(t=>!Object.hasOwn(t,'status')));
  assert.ok(actual.tasks.every(t=>!Object.hasOwn(t,'pickedBy')&&!Object.hasOwn(t,'completedBy')));
});
test('DB004 and DB005 engineering closures remain distinct from final release reviews',()=>{
  const completed=actual.tasks.find(t=>t.id==='DB-004');
  assert.equal(completed.done,true);
  assert.equal(completed.closureBasis,'ENGINEERING_ACCEPTED_RELEASE_REVIEW_DEFERRED');
  assert.equal(completed.deferredRelease.reviewRequired,true);
  assert.equal(completed.deferredRelease.releaseCertified,false);
  assert.equal(completed.deferredRelease.notWaived,true);
  const academic=actual.tasks.find(t=>t.id==='DB-005');
  assert.equal(academic.done,true);
  assert.equal(academic.closureBasis,'ENGINEERING_ACCEPTED_RELEASE_REVIEW_DEFERRED');
  assert.equal(academic.deferredRelease.notWaived,true);
  assert.equal(academic.deferredRelease.releaseCertified,false);
  assert.equal(academic.acceptanceEvidence[0].runUrl,'https://github.com/42Students/lms-vnext/actions/runs/40750567279');
  // DB007 now has its own registered PG17 source/consumer proof. It cannot
  // certify the global database phase or waive DB004/005 release reviews.
  const profile = actual.tasks.find(t=>t.id==='DB-007');
  assert.equal(profile.done,true);
  assert.ok(profile.acceptanceEvidence.some(e=>e.kind==='EXECUTED_REGISTERED_PG17_PRIVATE_PROFILE_AND_CONSUMER_SUITE' && e.result==='PASS'));
  assert.equal(actual.tasks.find(t=>t.id==='DB-020').done,true);
  assert.equal(actual.execution.globalPhaseCertificates.DATABASE.certified,false);
  assert.ok(inspectTracker(actual).deferredRelease.some(t=>t.id==='DB-004'));
  assert.ok(inspectTracker(actual).deferredRelease.some(t=>t.id==='DB-005'));
  assert.equal(inspectTracker(actual).readyForNextPhase,false);
});
test('deferred release cannot become a fake full acceptance or silent waiver',()=>{
  const x=clone(actual),t=x.tasks.find(t=>t.id==='DB-004');
  t.deferredRelease.notWaived=false;
  assert.ok(bad(x,'INVALID_DEFERRED_RELEASE_CLOSURE'));
  t.deferredRelease.notWaived=true;
  t.deferredRelease.releaseCertified=true;
  assert.ok(bad(x,'INVALID_DEFERRED_RELEASE_CLOSURE'));
  t.deferredRelease.releaseCertified=false;
  t.deferredRelease.items=[];
  assert.ok(bad(x,'INVALID_DEFERRED_RELEASE_CLOSURE'));
  delete t.deferredRelease;
  assert.ok(bad(x,'MISSING_DEFERRED_RELEASE_RECEIPT'));
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
  // All 33 packages are now completed. Reopen one package only in this
  // adversarial fixture: a still-closed parent must fail closed even when its
  // top-level task carries fabricated acceptance receipts.
  const db19=x.tasks.find(t=>t.id==='DB-019');
  assert.equal(db19.workPlan.packages.length,33);
  db19.workPlan.packages.find(p=>p.id==='DB19-P30').done=false;
  const broken=inspectTracker(x);
  assert.ok(broken.errors.some(e=>e.code==='DB19_PARENT_CLOSED_WITH_OPEN_PACKAGES'));
  assert.equal(broken.readyForNextPhase,false);
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
    assert.deepEqual(JSON.parse(p.stdout).counts,inspectTracker(actual).counts);
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
