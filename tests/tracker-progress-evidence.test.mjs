import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {inspectTracker,inspectDatabaseProgress,formatDatabaseProgress} from '../scripts/tracker.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const doc=JSON.parse(fs.readFileSync(path.join(root,'docs/tracker.json'),'utf8'));
const copy=()=>structuredClone(doc);
const invalid=(d,code)=>inspectTracker(d).errors.some(e=>e.code===code);
test('all 81 database tasks have anchored, unique, stage-specific non-certifying measurements',()=>{
  const result=inspectDatabaseProgress(doc);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.items.length,81);
  assert.equal(new Set(result.items.map(x=>x.id)).size,81);
  assert.equal(result.measurements.accepted.equivalentTasks,doc.tasks.filter(t=>t.done).length);
  assert.equal(result.notPhaseReadiness,true);
  assert.equal(result.equalWeightPerTask,true);
  assert.ok(result.measurements.discovery.percent>result.measurements.implementation.percent);
  assert.ok(result.measurements.implementation.percent>result.measurements.verification.percent);
  assert.ok(result.measurements.verification.percent>=result.measurements.accepted.percent);
  assert.ok(result.items.filter(x=>!x.done).every(x=>x.scores.implementation<1));
});
test('missing or duplicate progress rows are rejected without changing done state',()=>{
  const missing=copy();missing.execution.databaseProgress.items.pop();
  assert.ok(invalid(missing,'MISSING_DATABASE_PROGRESS_TASK'));
  const dup=copy();dup.execution.databaseProgress.items.push(structuredClone(dup.execution.databaseProgress.items[0]));
  assert.ok(invalid(dup,'DUPLICATE_DATABASE_PROGRESS_ID'));
});
test('fake PostgreSQL or task acceptance labels fail closed',()=>{
  const x=copy(),row=x.execution.databaseProgress.items.find(x=>x.id==='DB-019');
  row.verification='SCOPED_POSTGRES_PASS';
  assert.ok(invalid(x,'UNSUPPORTED_POSTGRES_PROGRESS_CLAIM'));
  row.verification='NOT_RUN';row.implementation='ACCEPTED_BY_CANONICAL_DONE';
  assert.ok(invalid(x,'PROGRESS_MUST_NOT_DECLARE_ACCEPTANCE'));
});
test('historical source notes never unlock phase acceptance',()=>{
  const x=copy(),r=inspectDatabaseProgress(x);
  assert.ok(r.items.find(t=>t.id==='DB-020').scores.implementation<1);
  assert.equal(r.measurements.accepted.equivalentTasks,x.tasks.filter(t=>t.done).length);
  assert.equal(inspectTracker(x).readyForNextPhase,false);
  assert.equal(x.execution.globalPhaseCertificates.DATABASE.certified,false);
});
test('progress CLI displays both all-lane metrics and one-lane breakdown',()=>{
  const p=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),'--progress'],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  assert.match(p.stdout,/NON|NON_CERTIFYING|evidence-weighted heuristic/);
  assert.match(p.stdout,/DB-081/);
  assert.ok(p.stdout.includes('accepted '+(100*doc.tasks.filter(t=>t.done).length/doc.tasks.length).toFixed(1)+'%'));
  const lane=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),'--progress','--lane=L01'],{encoding:'utf8'});
  assert.equal(lane.status,0,lane.stderr);
  assert.match(lane.stdout,/DB-019/);
  assert.doesNotMatch(lane.stdout,/DB-081/);
});
