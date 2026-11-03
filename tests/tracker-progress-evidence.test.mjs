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
  assert.equal(result.measurements.accepted.equivalentTasks,doc.tasks.filter(t=>t.phase==='DATABASE'&&t.done).length);
  assert.equal(result.notPhaseReadiness,true);
  assert.equal(result.equalWeightPerTask,true);
  // Accepted DB tasks now score 100% in every heuristic. That still does
  // not certify the separate DATABASE global phase gate.
  for(const metric of ['discovery','implementation','verification','accepted']){
    assert.equal(result.measurements[metric].percent,100);
    assert.equal(result.measurements[metric].equivalentTasks,81);
  }
  assert.equal(doc.execution.globalPhaseCertificates.DATABASE.certified,false);
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
  // DB019 now has a real scoped PostgreSQL receipt. A matching verified
  // label is valid; a forged or absent receipt must still be rejected.
  row.verification='SCOPED_POSTGRES_PASS';
  row.runs=[{url:'https://untrusted.example.invalid/fake-run',scope:'WORKFLOW_PASSED'}];
  assert.ok(invalid(x,'UNSUPPORTED_POSTGRES_PROGRESS_CLAIM'));
  row.runs=[];
  assert.ok(invalid(x,'UNSUPPORTED_POSTGRES_PROGRESS_CLAIM'));
  // Simulate an unfinished task declaring its own acceptance without
  // executed proof. Only the canonical task DONE bit can authorize this label.
  x.tasks.find(t=>t.id==='DB-019').done=false;
  row.verification='NOT_RUN';row.implementation='ACCEPTED_BY_CANONICAL_DONE';
  assert.ok(invalid(x,'PROGRESS_MUST_NOT_DECLARE_ACCEPTANCE'));
});
test('historical source notes never unlock phase acceptance',()=>{
  const x=copy(),r=inspectDatabaseProgress(x);
  assert.equal(r.items.find(t=>t.id==='DB-020').scores.implementation,1);
  assert.equal(r.items.find(t=>t.id==='DB-020').done,true);
  assert.equal(r.measurements.accepted.equivalentTasks,x.tasks.filter(t=>t.phase==='DATABASE'&&t.done).length);
  assert.equal(inspectTracker(x).readyForNextPhase,false);
  assert.equal(x.execution.globalPhaseCertificates.DATABASE.certified,false);
});
test('progress CLI displays all database tasks without exclusive ownership filters',()=>{
  const p=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),'--progress'],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  assert.match(p.stdout,/NON|NON_CERTIFYING|evidence-weighted heuristic/);
  assert.match(p.stdout,/DB-019/);
  assert.match(p.stdout,/DB-081/);
  assert.ok(p.stdout.includes('accepted '+(100*doc.tasks.filter(t=>t.phase==='DATABASE'&&t.done).length/doc.tasks.length).toFixed(1)+'%'));
  const domains=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),'--domains'],{encoding:'utf8'});
  assert.equal(domains.status,0,domains.stderr);
  assert.match(domains.stdout,/DATABASE DOMAIN PACKAGES/);
  assert.match(domains.stdout,/Learner profiles, identity and private evidence/);
});
