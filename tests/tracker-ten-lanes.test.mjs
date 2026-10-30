import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectTracker,inspectDomainPackages,inspectExecution} from '../scripts/tracker.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const doc=JSON.parse(fs.readFileSync(path.join(root,'docs/tracker.json'),'utf8'));
const invalid=(d,code)=>inspectTracker(d).errors.some(e=>e.code===code);

test('one execution JSON covers all 81 database tasks with informational domains, not worker assignments',()=>{
  assert.equal(Object.hasOwn(doc.execution,'lanes'),false);
  assert.equal(Object.hasOwn(doc.execution,'sharedChangeRequests'),false);
  assert.ok(doc.execution.domains.length>0);
  assert.ok(doc.execution.domains.every(d=>!('claim' in d)&&!('sourceOwnership' in d)&&!('id' in d)));
  const groups=inspectDomainPackages(doc);
  assert.deepEqual(groups.unassigned,[]);
  assert.deepEqual(groups.duplicates,[]);
  assert.deepEqual(groups.unknown,[]);
  assert.equal(groups.packages.reduce((n,x)=>n+x.total,0),81);
  assert.equal(groups.packages.reduce((n,x)=>n+x.done,0),doc.tasks.filter(t=>t.done).length);
  assert.deepEqual(inspectTracker(doc).errors,[]);
});

test('any contributor can work across domains without claims, while all five phase gates remain intact',()=>{
  const e=inspectExecution(doc);
  assert.equal(e.domains.length,doc.execution.domains.length);
  for(const [phase,total] of Object.entries({API:10,UI:10,DESIGN:6,RELEASE:7})){
    assert.equal(e.phases[phase].total,total);
    assert.equal(e.phases[phase].done,0);
    assert.equal(e.certificates[phase].certified,false);
  }
  assert.equal(e.certificates.DATABASE.certified,false);
  assert.equal(e.readyForNextPhase,false);
});

test('retired exclusive assignment or claim contracts cannot be silently restored',()=>{
  const x=structuredClone(doc);
  x.execution.lanes=[{id:'L01',claim:{sessionId:'pretend'}}];
  assert.ok(invalid(x,'RETIRED_LANE_COORDINATION_PRESENT'));
  delete x.execution.lanes;
  x.execution.domains[0].dbTaskIds=[];
  assert.ok(invalid(x,'INVALID_DOMAIN_GROUPS'));
  x.execution.domains=structuredClone(doc.execution.domains);
  assert.deepEqual(inspectTracker(x).errors,[]);
});

test('future-phase DONE and certification cannot be asserted without executed proof',()=>{
  const x=structuredClone(doc);
  x.execution.milestones[0].done=true;
  assert.ok(invalid(x,'MILESTONE_DONE_WITHOUT_EXECUTED_PROOF'));
  x.execution.milestones[0].done=false;
  x.execution.globalPhaseCertificates.API.certified=true;
  assert.ok(invalid(x,'CERTIFIED_PHASE_WITHOUT_EXECUTED_PROOF'));
});

test('open-contribution CLI reads one tracker and never prints assignment claims',()=>{
  for(const flag of ['--domains','--closure-next','--roadmap','--check']){
    const r=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),flag],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr||r.stdout);
    if(flag==='--domains')assert.match(r.stdout,/DATABASE DOMAIN PACKAGES/);
    if(flag==='--closure-next')assert.match(r.stdout,/No exclusive assignments/);
  }
});

test('all five global phases live in one plan in exact gate order',()=>{
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
    assert.equal(Object.hasOwn(p,'ownerLanes'),false);
    assert.equal(e.globalPhases[i].gateCertified,false);
  }
  assert.equal(e.globalPhases[0].total,81);
  assert.equal(e.globalPhases[0].accepted,doc.tasks.filter(t=>t.done).length);
  assert.deepEqual(inspectTracker(doc).errors,[]);
});

test('missing or reordered global phase fails closed',()=>{
  const x=structuredClone(doc);
  x.execution.globalPhases.splice(3,1);
  assert.ok(invalid(x,'INVALID_FIVE_GLOBAL_PHASES'));
  x.execution.globalPhases=structuredClone(doc.execution.globalPhases);
  x.execution.globalPhases[3].prerequisitePhaseIds=['DATABASE'];
  assert.ok(invalid(x,'INVALID_GLOBAL_PHASE_CONTRACT'));
});

test('later global phase cannot certify before prerequisites or with open milestones',()=>{
  const x=structuredClone(doc);
  x.execution.globalPhaseCertificates.DESIGN={
    certified:true,evidence:[{kind:'EXECUTED_ACCEPTANCE',commitSha:'b'.repeat(40),exitCode:0,result:'PASS'}]
  };
  assert.ok(invalid(x,'PHASE_CERTIFIED_BEFORE_PREREQUISITE'));
  assert.ok(invalid(x,'PHASE_CERTIFIED_WITH_OPEN_WORK'));
});

test('roadmap preserves distinct DESIGN Green stage',()=>{
  const r=spawnSync(process.execPath,[path.join(root,'scripts/tracker.mjs'),'--roadmap'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr||r.stdout);
  for(const p of doc.execution.globalPhases)assert.ok(r.stdout.includes(p.title),p.id+' absent');
  assert.match(r.stdout,/Five global phases/);
  assert.match(r.stdout,/DESIGN|Design Green/);
});
