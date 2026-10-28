import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectTracker,inspectDomainPackages,inspectExecution} from '../scripts/tracker.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const doc=JSON.parse(fs.readFileSync(path.join(root,'docs/tracker.json'),'utf8'));
const invalid=(d,code)=>inspectTracker(d).errors.some(e=>e.code===code);

test('one execution JSON covers all 81 DB tasks with ten collision-free worker lanes',()=>{
 const lanes=doc.execution.lanes;
 assert.equal(lanes.length,10);
 assert.deepEqual(lanes.map(x=>x.id),Array.from({length:10},(_,i)=>'L'+String(i+1).padStart(2,'0')));
 const groups=inspectDomainPackages(doc);
 assert.deepEqual(groups.unassigned,[]);
 assert.deepEqual(groups.duplicates,[]);
 assert.deepEqual(groups.unknown,[]);
 assert.equal(groups.packages.reduce((n,x)=>n+x.total,0),81);
 assert.equal(groups.packages.reduce((n,x)=>n+x.done,0),doc.tasks.filter(t=>t.done).length);
 assert.equal(inspectTracker(doc).errors.length,0);
});

test('the same single tracker tracks non-DB stages without faking acceptance',()=>{
 const e=inspectExecution(doc);
 for(const [phase,total] of Object.entries({API:10,UI:10,DESIGN:6,RELEASE:7})){
   assert.equal(e.phases[phase].total,total);
   assert.equal(e.phases[phase].done,0);
   assert.equal(e.certificates[phase].certified,false);
 }
 assert.equal(e.certificates.DATABASE.certified,false);
 assert.equal(e.readyForNextPhase,false);
});

test('duplicate active chat claims cannot silently coexist',()=>{
 const x=structuredClone(doc);
 const claim={sessionId:'chat-l03-example',holder:'chat-03',claimedAt:'2026-10-29T00:00:00.000Z',expiresAt:'2026-10-30T00:00:00.000Z'};
 x.execution.lanes[2].claim=claim;
 x.execution.lanes[3].claim={...claim};
 assert.ok(invalid(x,'DUPLICATE_ACTIVE_LANE_CLAIM'));
 x.execution.lanes[3].claim=null;
 assert.deepEqual(inspectTracker(x).errors,[]);
});

test('a bogus lane or incomplete claim is structurally rejected',()=>{
 const x=structuredClone(doc);
 x.execution.lanes[0].id='L99';
 assert.ok(invalid(x,'INVALID_TEN_LANE_MAP'));
 x.execution.lanes[0].id='L01';
 x.execution.lanes[0].claim={sessionId:'id',holder:'test',claimedAt:'2026-10-29T00:00:00Z',expiresAt:'2026-10-28T00:00:00Z'};
 assert.ok(invalid(x,'INVALID_LANE_CLAIM'));
});

test('future-phase DONE and certification cannot be asserted without executed proof',()=>{
 const x=structuredClone(doc);
 x.execution.milestones[0].done=true;
 assert.ok(invalid(x,'MILESTONE_DONE_WITHOUT_EXECUTED_PROOF'));
 x.execution.milestones[0].done=false;
 x.execution.globalPhaseCertificates.API.certified=true;
 assert.ok(invalid(x,'CERTIFIED_PHASE_WITHOUT_EXECUTED_PROOF'));
});

test('the per-lane and all-lanes CLI read the sole tracker',()=>{
 for(const flag of ['--lane=L03','--lanes','--check']){
   const r=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),flag],{encoding:'utf8'});
   assert.equal(r.status,0,r.stderr||r.stdout);
   if(flag==='--lane=L03'){
     assert.match(r.stdout,/L03 Learner profiles/);
     assert.doesNotMatch(r.stdout,/L04 Courses/);
   }
 }
});
