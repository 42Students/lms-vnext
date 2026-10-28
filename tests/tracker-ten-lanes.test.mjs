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

test('all five global phases live in one plan in the correct gate order',()=>{
 const ids=doc.execution.globalPhases.map(p=>p.id);
 assert.deepEqual(ids,['DATABASE','API','UI','DESIGN','RELEASE']);
 const e=inspectExecution(doc);
 assert.deepEqual(e.globalPhases.map(p=>p.id),ids);
 for(const [i,p] of doc.execution.globalPhases.entries()){
   assert.equal(p.sequence,i+1);
   assert.equal(p.completionEvidencePath,'execution.globalPhaseCertificates.'+p.id);
   assert.deepEqual(p.prerequisitePhaseIds,i?[ids[i-1]]:[]);
   assert.ok(p.entryCriteria.length>=1);
   assert.ok(p.workstreams.length>=1);
   assert.ok(p.exitCriteria.length>=1);
   assert.ok(p.verification.length>=1);
   assert.equal(e.globalPhases[i].gateCertified,false);
 }
 assert.equal(e.globalPhases[0].total,81);
 assert.equal(e.globalPhases[0].accepted,doc.tasks.filter(t=>t.done).length);
 assert.deepEqual(inspectTracker(doc).errors,[]);
});

test('a missing, reordered or ungrounded global phase fails closed',()=>{
 const x=structuredClone(doc);
 x.execution.globalPhases.splice(3,1);
 assert.ok(invalid(x,'INVALID_FIVE_GLOBAL_PHASES'));
 x.execution.globalPhases=structuredClone(doc.execution.globalPhases);
 x.execution.globalPhases[3].prerequisitePhaseIds=['DATABASE'];
 assert.ok(invalid(x,'INVALID_GLOBAL_PHASE_CONTRACT'));
});

test('a later global phase cannot certify before prerequisites or with open milestones',()=>{
 const x=structuredClone(doc);
 x.execution.globalPhaseCertificates.DESIGN={
   certified:true,evidence:[{kind:'EXECUTED_ACCEPTANCE',commitSha:'b'.repeat(40),exitCode:0,result:'PASS'}]
 };
 assert.ok(invalid(x,'PHASE_CERTIFIED_BEFORE_PREREQUISITE'));
 assert.ok(invalid(x,'PHASE_CERTIFIED_WITH_OPEN_WORK'));
});

test('the roadmap command shows all five phases distinctly including Design Green',()=>{
 const r=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),'--roadmap'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);
 for(const p of doc.execution.globalPhases)assert.ok(r.stdout.includes(p.title),p.id+' absent');
 assert.match(r.stdout,/Five global phases/);
 assert.match(r.stdout,/DESIGN|Design Green/);
});
