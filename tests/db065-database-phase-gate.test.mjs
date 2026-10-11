import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { inspectGate, inspectCheckout, PHASES, TASK_STATES } from '../scripts/db065-database-phase-gate.mjs';
const SHA='f'.repeat(40);
const states=()=>({currentPhase:'DATABASE',phases:Object.fromEntries(PHASES.map(p=>[p,{state:p==='DATABASE'?'ACTIVE':'LOCKED',certifiedAt:null,requiredGates:['PostgreSQL negative tests']}]))});
const task=(id,status='READY',overrides={})=>({id,phase:'DATABASE',status,dependsOn:[],restriction:'ANY',pickedBy:null,completionCommitSha:null,verifiedAt:null,verifiedBy:null,verificationEvidence:[], ...overrides});
const lanes=()=>Array.from({length:6},(_,i)=>({chatNumber:i+1,currentPhase:'DATABASE',activeTaskId:null}));
const input=()=>({phaseState:states(),workQueue:{phase:'DATABASE',tasks:[task('DB-101')]},lanes:lanes()});
const bad=r=>r.errors.map(x=>x.code);
const guarded=x=>inspectGate(x);
const withActive=(n=5)=>{const x=input();x.workQueue.tasks=[task('DB-101','IN_PROGRESS',{pickedBy:n})];x.lanes[n-1].activeTaskId='DB-101';return x;};

test('static gate never claims database acceptance, even with no tasks',()=>{
 const x=input();x.workQueue.tasks=[];x.phaseState.phases.DATABASE.certifiedAt='2026-10-11';const r=guarded(x);
 assert.equal(r.readyForNextPhase,false);assert.equal(r.verification,'SOURCE_COORDINATION_ONLY_NOT_DATABASE_ACCEPTANCE');
 assert.deepEqual(r.errors,[]);assert.equal(r.phaseTasksAllVerified,true);
});
test('actual READY work remains open and blocks collective phase readiness',()=>{
 const r=guarded(input());assert.deepEqual(r.errors,[]);assert.deepEqual(r.openTaskIds,['DB-101']);
 assert.equal(r.phaseTasksAllVerified,false);assert.ok(r.blockers.some(x=>x.code==='PHASE_TASKS_UNVERIFIED'));
});
test('COMPLETED implementation still counts open without PostgreSQL acceptance',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','COMPLETED',{completionCommitSha:SHA})];const r=guarded(x);
 assert.deepEqual(r.errors,[]);assert.equal(r.counts.COMPLETED,1);assert.equal(r.phaseTasksAllVerified,false);
 assert.ok(r.blockers.some(x=>x.implementedWithoutProof===1));
});
test('rejects claimed completion without a commit SHA',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','COMPLETED')];assert.ok(bad(guarded(x)).includes('COMPLETED_WITHOUT_COMMIT'));
});
test('rejects fabricated DONE_VERIFIED status lacking attestation fields',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','DONE_VERIFIED',{completionCommitSha:SHA})];assert.ok(bad(guarded(x)).includes('VERIFIED_WITHOUT_EVIDENCE'));
});
test('DONE_VERIFIED with metadata never alone promotes the global phase',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','DONE_VERIFIED',{completionCommitSha:SHA,verifiedAt:'2026-10-11',verifiedBy:5,verificationEvidence:[{command:'node --test',exitCode:0}]})];
 const r=guarded(x);assert.deepEqual(r.errors,[]);assert.equal(r.phaseTasksAllVerified,true);assert.equal(r.readyForNextPhase,false);
});
test('rejects duplicate task IDs across queues',()=>{
 const x=input();x.workQueue.tasks.push(task('DB-101'));assert.ok(bad(guarded(x)).includes('DUPLICATE_OR_INVALID_TASK_ID'));
});
test('rejects invalid status and out-of-phase task',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','GUESSED',{phase:'LAUNCH'})];assert.ok(bad(guarded(x)).includes('INVALID_TASK_STATUS'));assert.ok(bad(guarded(x)).includes('INVALID_TASK_PHASE'));
});
test('rejects unknown prerequisites explicitly',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','READY',{dependsOn:['DB-404']})];assert.ok(bad(guarded(x)).includes('UNKNOWN_DEPENDENCY'));
});
test('rejects a self-referential dependency cycle',()=>{
 const x=input();x.workQueue.tasks=[task('DB-101','READY',{dependsOn:['DB-101']})];assert.ok(bad(guarded(x)).includes('DEPENDENCY_CYCLE'));
});
test('rejects transitive multi-task dependency cycles',()=>{
 const x=input();x.workQueue.tasks=[task('A','READY',{dependsOn:['B']}),task('B','READY',{dependsOn:['C']}),task('C','READY',{dependsOn:['A']})];
 assert.ok(bad(guarded(x)).includes('DEPENDENCY_CYCLE'));
});
test('validates coherent active worker claim and checkpoint',()=>{
 const r=guarded(withActive());assert.deepEqual(r.errors,[]);assert.deepEqual(r.openTaskIds,['DB-101']);
});
test('rejects concurrent active tasks claimed by one chat',()=>{
 const x=withActive();x.workQueue.tasks.push(task('DB-102','IN_PROGRESS',{pickedBy:5}));assert.ok(bad(guarded(x)).includes('DUPLICATE_ACTIVE_WORKER'));
});
test('rejects migration-integrator claims by workers other than Chat 1',()=>{
 const x=withActive();x.workQueue.tasks[0].restriction='MIGRATION_INTEGRATOR';assert.ok(bad(guarded(x)).includes('MIGRATION_WRITER_NOT_CHAT1'));
});
test('accepts Chat 1 migration-integrator claim when paired with its lane',()=>{
 const x=withActive(1);x.workQueue.tasks[0].restriction='MIGRATION_INTEGRATOR';assert.deepEqual(guarded(x).errors,[]);
});
test('detects mismatched lane checkpoint for active task',()=>{
 const x=withActive();x.lanes[4].activeTaskId='DB-999';assert.ok(bad(guarded(x)).includes('LANE_ACTIVE_CLAIM_MISMATCH'));
});
test('detects checkpoint carrying stale active task',()=>{
 const x=input();x.lanes[4].activeTaskId='DB-101';assert.ok(bad(guarded(x)).includes('STALE_LANE_ACTIVE_TASK'));
});
test('rejects two lanes using one worker identity',()=>{
 const x=input();x.lanes[5].chatNumber=5;assert.ok(bad(guarded(x)).includes('INVALID_WORKER_ID'));
});
test('rejects fewer than six lane checkpoints',()=>{
 const x=input();x.lanes=x.lanes.slice(0,5);assert.ok(bad(guarded(x)).includes('MISSING_WORKER_CHECKPOINTS'));
});
test('rejects active next phase while DATABASE remains current',()=>{
 const x=input();x.phaseState.phases.API.state='ACTIVE';assert.ok(bad(guarded(x)).includes('FUTURE_PHASE_UNLOCKED'));
});
test('rejects current phase that is not marked ACTIVE',()=>{
 const x=input();x.phaseState.phases.DATABASE.state='LOCKED';assert.ok(bad(guarded(x)).includes('ACTIVE_PHASE_MISMATCH'));
});
test('rejects unlocking API when prior DATABASE certification is missing',()=>{
 const x=input();x.phaseState.currentPhase='API';x.phaseState.phases.API.state='ACTIVE';x.workQueue.phase='API';x.workQueue.tasks=[];
 assert.ok(bad(guarded(x)).includes('PREVIOUS_PHASE_NOT_CERTIFIED'));
});
test('rejects queue current phase mismatch',()=>{
 const x=input();x.workQueue.phase='UI';assert.ok(bad(guarded(x)).includes('QUEUE_PHASE_MISMATCH'));
});
test('records active task with unverified prerequisite as blocker, not as valid acceptance',()=>{
 const x=withActive();x.workQueue.tasks.push(task('DB-100','COMPLETED',{completionCommitSha:SHA}));x.workQueue.tasks[0].dependsOn=['DB-100'];
 const r=guarded(x);assert.deepEqual(r.errors,[]);assert.ok(r.blockers.some(x=>x.code==='UNVERIFIED_ACTIVE_DEPENDENCY'));
});
test('handles invalid queue input without crashing',()=>{
 const x=input();x.workQueue.tasks='bogus';assert.ok(bad(guarded(x)).includes('INVALID_WORK_QUEUE'));
});
test('read-only checkout fails closed on missing source files',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'db065-empty-'));
 try{assert.throws(()=>inspectCheckout(root),/ENOENT/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('CLI checks synthetic six-lane checkout and returns exit 0 on structural validity',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'db065-cli-'));const x=withActive();
 try{
  const write=(rel,obj)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(obj));};
  write('docs/coordination/phase-state.json',x.phaseState);write('docs/coordination/work-queue.json',x.workQueue);
  x.lanes.forEach((lane,i)=>write('docs/coordination/lanes/chat-0'+(i+1)+'.json',lane));
  const proc=spawnSync(process.execPath,[path.resolve(import.meta.dirname,'../scripts/db065-database-phase-gate.mjs'),root],{encoding:'utf8'});
  assert.equal(proc.status,0,proc.stderr);assert.equal(JSON.parse(proc.stdout).readyForNextPhase,false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('CLI fails closed with exit 2 when synthetic claim is invalid',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'db065-cli-bad-'));const x=withActive();x.lanes[4].activeTaskId='DB-100';
 try{
  const write=(rel,obj)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(obj));};
  write('docs/coordination/phase-state.json',x.phaseState);write('docs/coordination/work-queue.json',x.workQueue);
  x.lanes.forEach((lane,i)=>write('docs/coordination/lanes/chat-0'+(i+1)+'.json',lane));
  const proc=spawnSync(process.execPath,[path.resolve(import.meta.dirname,'../scripts/db065-database-phase-gate.mjs'),root],{encoding:'utf8'});
  assert.equal(proc.status,2,proc.stderr);assert.ok(JSON.parse(proc.stdout).errors.length);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
