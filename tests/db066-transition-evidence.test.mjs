import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {inspectTransitionEvidence,inspectCheckout,PHASE_SEQUENCE} from '../scripts/db066-transition-evidence.mjs';
const SHA='a'.repeat(40);
const now='2026-10-12T00:30:00+05:30';
const phases=()=>Object.fromEntries(PHASE_SEQUENCE.map(p=>[p,{state:p==='DATABASE'?'ACTIVE':'LOCKED',certifiedAt:null,requiredGates:['tenant FK','migration replay'],evidence:[]} ]));
const doc=()=>({phaseState:{currentPhase:'DATABASE',phases:phases()},workQueue:{phase:'DATABASE',tasks:[]}});
const issue=(i,c)=>inspectTransitionEvidence(i).issues.some(x=>x.code===c);
const verified=()=>({id:'DB-001',phase:'DATABASE',status:'DONE_VERIFIED',completionCommitSha:SHA,verifiedAt:now,
 verificationEvidence:[{kind:'EXECUTED',exitCode:0,commands:['node --test tests/check.test.mjs']} ]});

test('valid current-phase queue has no additional forensic flags and never promotes',()=>{
 const r=inspectTransitionEvidence(doc());assert.deepEqual(r.issues,[]);assert.equal(r.readyForNextPhase,false);
});
test('rejects a future API task smuggled into current DATABASE queue',()=>{
 const x=doc();x.workQueue.tasks=[{id:'API-001',phase:'API',status:'READY'}];
 assert.ok(issue(x,'TASK_OUTSIDE_GLOBAL_ACTIVE_PHASE'));
});
test('rejects false retirement with status only',()=>{
 const x=doc();x.workQueue.tasks=[{id:'DB-001',phase:'DATABASE',status:'RETIRED_APPROVED'}];
 assert.ok(issue(x,'RETIREMENT_WITHOUT_EXPLICIT_USER_APPROVAL'));
});
test('retirement requires user signoff, rationale and traceable approval',()=>{
 const x=doc();const t={id:'DB-001',phase:'DATABASE',status:'RETIRED_APPROVED',retirementApproval:
  {approvedBy:'USER',approvedAt:now,reason:'Explicit retirement decision',approvalRef:'https://github.com/example/issues/1'}};
 x.workQueue.tasks=[t];assert.equal(issue(x,'RETIREMENT_WITHOUT_EXPLICIT_USER_APPROVAL'),false);
 t.retirementApproval.approvedBy='worker-5';assert.ok(issue(x,'RETIREMENT_WITHOUT_EXPLICIT_USER_APPROVAL'));
});
test('rejects verified status backed only by authored tests',()=>{
 const x=doc();const t=verified();t.verificationEvidence=[{kind:'AUTHORED',exitCode:0,commands:['node --test']}];
 x.workQueue.tasks=[t];assert.ok(issue(x,'VERIFICATION_WITHOUT_EXECUTED_COMMAND_EVIDENCE'));
});
test('rejects verified status backed by an executed failing command',()=>{
 const x=doc();const t=verified();t.verificationEvidence[0].exitCode=1;x.workQueue.tasks=[t];
 assert.ok(issue(x,'VERIFICATION_WITHOUT_EXECUTED_COMMAND_EVIDENCE'));
});
test('accepts detailed executed source tooling proof without calling it PG acceptance',()=>{
 const x=doc();x.workQueue.tasks=[verified()];const r=inspectTransitionEvidence(x);
 assert.deepEqual(r.issues,[]);assert.equal(r.readyForNextPhase,false);
});
test('rejects self-reported phase certification without all required gates',()=>{
 const x=doc();x.phaseState.currentPhase='API';x.workQueue.phase='API';
 x.phaseState.phases.DATABASE.state='CERTIFIED';x.phaseState.phases.DATABASE.certifiedAt=now;
 x.phaseState.phases.API.state='ACTIVE';
 x.phaseState.phases.DATABASE.evidence=[{gate:'tenant FK',kind:'EXECUTED',result:'PASSED',exitCode:0,commitSha:SHA,commands:['node witness.mjs']}];
 assert.ok(issue(x,'PRIOR_PHASE_GATE_WITHOUT_EXECUTED_PROOF'));
});
test('prior gate rejects source-only or unexecuted evidence masquerading as acceptance',()=>{
 const x=doc();x.phaseState.currentPhase='API';x.workQueue.phase='API';
 x.phaseState.phases.DATABASE.state='CERTIFIED';x.phaseState.phases.DATABASE.certifiedAt=now;x.phaseState.phases.API.state='ACTIVE';
 x.phaseState.phases.DATABASE.evidence=['tenant FK','migration replay'].map(gate=>
  ({gate,kind:'AUTHORED',result:'PASSED',exitCode:0,commitSha:SHA,commands:['node witness.mjs']}));
 assert.equal(inspectTransitionEvidence(x).issues.filter(z=>z.code==='PRIOR_PHASE_GATE_WITHOUT_EXECUTED_PROOF').length,2);
});
test('even complete proof metadata cannot independently promote next phase',()=>{
 const x=doc();x.phaseState.currentPhase='API';x.workQueue.phase='API';
 x.phaseState.phases.DATABASE.state='CERTIFIED';x.phaseState.phases.DATABASE.certifiedAt=now;x.phaseState.phases.API.state='ACTIVE';
 x.phaseState.phases.DATABASE.evidence=['tenant FK','migration replay'].map(gate=>
  ({gate,kind:'EXECUTED',result:'PASSED',exitCode:0,commitSha:SHA,commands:['node witness.mjs']}));
 const r=inspectTransitionEvidence(x);assert.deepEqual(r.issues,[]);assert.equal(r.readyForNextPhase,false);
});
test('rejects missing task list and queue phase mismatch',()=>{
 const x=doc();x.workQueue.phase='UI';assert.ok(issue(x,'QUEUE_PHASE_MISMATCH'));
 x.workQueue.tasks=null;assert.ok(issue(x,'INVALID_TASK_LIST'));
});
test('read-only checkout and CLI detect invalid evidence without writing',()=>{
 const x=doc();x.workQueue.tasks=[{id:'DB-1',phase:'DATABASE',status:'RETIRED_APPROVED'}];
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'db066-'));
 try{
  const write=(relative,obj)=>{const p=path.join(dir,relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(obj));};
  write('docs/coordination/phase-state.json',x.phaseState);write('docs/coordination/work-queue.json',x.workQueue);
  assert.ok(inspectCheckout(dir).issues.some(v=>v.code==='RETIREMENT_WITHOUT_EXPLICIT_USER_APPROVAL'));
  const run=spawnSync(process.execPath,[path.resolve(import.meta.dirname,'../scripts/db066-transition-evidence.mjs'),dir],{encoding:'utf8'});
  assert.equal(run.status,2,run.stderr);assert.ok(JSON.parse(run.stdout).issues.length);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
