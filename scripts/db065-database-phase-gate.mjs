#!/usr/bin/env node
// DB-065 read-only structural phase/claim preflight. Not PostgreSQL acceptance.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASES = Object.freeze(['DATABASE', 'API', 'UI', 'RELEASE']);
export const TASK_STATES = Object.freeze(['READY','PICKED','IN_PROGRESS','COMPLETED','BLOCKED','DONE_VERIFIED','RETIRED_APPROVED']);
const complete = new Set(['DONE_VERIFIED', 'RETIRED_APPROVED']);
const active = new Set(['PICKED', 'IN_PROGRESS']);
const isSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
const push = (errors, code, extra = {}) => errors.push({code, ...extra});
const validWorker = n => Number.isInteger(n) && n >= 1 && n <= 6;
const validPath = p => typeof p === 'string' && p.trim() === p && p.length > 0 &&
  !p.startsWith('/') && !p.includes(String.fromCharCode(92)) && !p.split('/').some(x => x === '..' || x === '.');
const directoryScope = p => p.endsWith('/**') ? p.slice(0,-2) : p.endsWith('/') ? p : null;
const pathsOverlap = (a,b) => {
  if (a === b) return true;
  const da = directoryScope(a), db = directoryScope(b);
  if (da && b.startsWith(da)) return true;
  if (db && a.startsWith(db)) return true;
  // Unknown glob patterns may intersect; fail closed rather than allow competing writers.
  if (a.includes('*') || b.includes('*')) {
    const prefix = p => p.slice(0,p.indexOf('*'));
    const pa = a.includes('*') ? prefix(a) : a, pb = b.includes('*') ? prefix(b) : b;
    return pa.startsWith(pb) || pb.startsWith(pa);
  }
  return false;
};
const protectedPath = p => ['drizzle/','src/db/schema/index.ts','.github/workflows/',
  'package.json','package-lock.json','pnpm-lock.yaml','yarn.lock','bun.lock','bun.lockb',
  'pnpm-workspace.yaml'].some(locked => pathsOverlap(p,locked));

export function inspectGate({phaseState, workQueue, lanes}) {
  const errors = [], blockers = [];
  const phase = phaseState?.currentPhase;
  const all = workQueue?.tasks;
  if (!PHASES.includes(phase)) push(errors,'INVALID_CURRENT_PHASE',{phase});
  if (!Array.isArray(all)) return {
    verification:'SOURCE_COORDINATION_ONLY_NOT_DATABASE_ACCEPTANCE', readyForNextPhase:false,
    errors:[...errors,{code:'INVALID_WORK_QUEUE'}], blockers, counts:{}, activePhase:phase ?? null,
  };
  if (!Array.isArray(lanes) || lanes.length !== 6) push(errors,'MISSING_WORKER_CHECKPOINTS');
  const byId = new Map(), ownerTask = new Map(), laneByNumber = new Map(), activePaths = [];
  const counts = Object.fromEntries(TASK_STATES.map(x=>[x,0]));
  for (const lane of lanes || []) {
    if (!validWorker(lane?.chatNumber) || laneByNumber.has(lane.chatNumber))
      push(errors,'INVALID_WORKER_ID',{worker:lane?.chatNumber ?? null});
    else {
      laneByNumber.set(lane.chatNumber,lane);
      if (lane.currentPhase !== phase) push(errors,'LANE_PHASE_MISMATCH',{worker:lane.chatNumber,phase:lane.currentPhase});
    }
  }
  for (const p of PHASES) {
    const observed = phaseState?.phases?.[p];
    if (!observed || !['ACTIVE','LOCKED','CERTIFIED'].includes(observed.state))
      push(errors,'INVALID_PHASE_STATE',{phase:p,state:observed?.state ?? null});
    if (p === phase && observed?.state !== 'ACTIVE') push(errors,'ACTIVE_PHASE_MISMATCH',{phase:p});
    if (PHASES.indexOf(p) > PHASES.indexOf(phase) && observed?.state !== 'LOCKED')
      push(errors,'FUTURE_PHASE_UNLOCKED',{phase:p});
    if (PHASES.indexOf(p) > PHASES.indexOf(phase) && observed?.certifiedAt != null)
      push(errors,'FUTURE_PHASE_PREMATURE_CERTIFICATION',{phase:p});
    if (PHASES.indexOf(p) < PHASES.indexOf(phase) && observed?.state !== 'CERTIFIED')
      push(errors,'PREVIOUS_PHASE_NOT_CERTIFIED',{phase:p});
  }
  if (workQueue.phase !== phase) push(errors,'QUEUE_PHASE_MISMATCH',{phase:workQueue.phase});
  for (const task of all) {
    if (typeof task?.id !== 'string' || !task.id.trim() || task.id.trim() !== task.id || byId.has(task.id)) {
      push(errors,'DUPLICATE_OR_INVALID_TASK_ID',{id:task?.id ?? null}); continue;
    }
    byId.set(task.id,task);
    if (!TASK_STATES.includes(task.status)) push(errors,'INVALID_TASK_STATUS',{id:task.id,status:task.status});
    else counts[task.status]++;
    if (!PHASES.includes(task.phase)) push(errors,'INVALID_TASK_PHASE',{id:task.id});
    if (!Array.isArray(task.dependsOn) || task.dependsOn.some(d=>typeof d !== 'string' || !d.trim()))
      push(errors,'INVALID_TASK_DEPENDENCIES',{id:task.id});
    if (!Array.isArray(task.paths) || task.paths.some(p=>!validPath(p)))
      push(errors,'INVALID_TASK_PATHS',{id:task.id});
    if (active.has(task.status)) {
      if (task.phase !== phase) push(errors,'ACTIVE_TASK_WRONG_PHASE',{id:task.id,taskPhase:task.phase,phase});
      if (!validWorker(task.pickedBy))
        push(errors,'ACTIVE_TASK_WITHOUT_WORKER',{id:task.id});
      else if (ownerTask.has(task.pickedBy)) push(errors,'DUPLICATE_ACTIVE_WORKER',{worker:task.pickedBy,tasks:[ownerTask.get(task.pickedBy),task.id]});
      else ownerTask.set(task.pickedBy,task.id);
      if (task.restriction === 'MIGRATION_INTEGRATOR' && task.pickedBy !== 1)
        push(errors,'MIGRATION_WRITER_NOT_CHAT1',{id:task.id,worker:task.pickedBy});
      if (task.restriction === 'CORE_INFRA' && task.pickedBy !== 1)
        push(errors,'CORE_INFRA_NOT_CHAT1',{id:task.id,worker:task.pickedBy});
      if (Array.isArray(task.paths)) for (const p of task.paths.filter(validPath)) {
        if (task.pickedBy !== 1 && protectedPath(p))
          push(errors,'PROTECTED_PATH_NOT_CHAT1',{id:task.id,worker:task.pickedBy,path:p});
        for (const other of activePaths) if (other.worker !== task.pickedBy && pathsOverlap(p,other.path))
          push(errors,'ACTIVE_PATH_COLLISION',{tasks:[other.id,task.id],paths:[other.path,p]});
        activePaths.push({id:task.id,worker:task.pickedBy,path:p});
      }
    }
    if (task.status === 'COMPLETED' && !isSha(task.completionCommitSha))
      push(errors,'COMPLETED_WITHOUT_COMMIT',{id:task.id});
    if (task.status === 'DONE_VERIFIED') {
      if (!isSha(task.completionCommitSha) || !task.verifiedAt || !validWorker(task.verifiedBy) ||
          !Array.isArray(task.verificationEvidence) || task.verificationEvidence.length === 0)
        push(errors,'VERIFIED_WITHOUT_EVIDENCE',{id:task.id});
    }
  }
  for (const task of byId.values()) {
    for (const dependency of Array.isArray(task.dependsOn) ? task.dependsOn : []) {
      if (!byId.has(dependency)) push(errors,'UNKNOWN_DEPENDENCY',{id:task.id,dependency});
      else if ((active.has(task.status) || task.status === 'DONE_VERIFIED') && !complete.has(byId.get(dependency).status))
        blockers.push({code:'UNVERIFIED_ACTIVE_DEPENDENCY',id:task.id,dependency,status:byId.get(dependency).status});
    }
  }
  const visiting = new Set(), visited = new Set();
  const visit = (id, trail) => {
    if (visiting.has(id)) {push(errors,'DEPENDENCY_CYCLE',{path:[...trail,id]});return;}
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of (Array.isArray(byId.get(id)?.dependsOn) ? byId.get(id).dependsOn : [])) if (byId.has(dep)) visit(dep,[...trail,id]);
    visiting.delete(id);visited.add(id);
  };
  for (const id of byId.keys()) visit(id,[]);
  for (const [worker,id] of ownerTask) {
    const lane=laneByNumber.get(worker);
    if (!lane || lane.activeTaskId !== id || lane.currentPhase !== phase)
      push(errors,'LANE_ACTIVE_CLAIM_MISMATCH',{worker,task:id,laneTask:lane?.activeTaskId ?? null});
  }
  for (const [worker,lane] of laneByNumber) {
    if (lane.activeTaskId && ownerTask.get(worker) !== lane.activeTaskId)
      push(errors,'STALE_LANE_ACTIVE_TASK',{worker,laneTask:lane.activeTaskId});
  }
  const open = all.filter(t=>t.phase===phase && !complete.has(t.status));
  const verifiedTasks = all.filter(t=>t.phase===phase && t.status==='DONE_VERIFIED').length;
  const unverified = all.filter(t=>t.phase===phase && t.status==='COMPLETED');
  if (open.length) blockers.push({code:'PHASE_TASKS_UNVERIFIED',count:open.length,
    implementedWithoutProof:unverified.length,verifiedTasks});
  if (open.length && phaseState?.phases?.[phase]?.certifiedAt)
    push(errors,'PREMATURE_PHASE_CERTIFICATION',{phase,openTaskCount:open.length});
  if (!phaseState?.phases?.[phase]?.certifiedAt)
    blockers.push({code:'NO_PHASE_CERTIFICATION'});
  const gates=(phaseState?.phases?.[phase]?.requiredGates || []);
  if (!Array.isArray(gates) || gates.length===0) push(errors,'NO_PHASE_GATES');
  return {
    verification:'SOURCE_COORDINATION_ONLY_NOT_DATABASE_ACCEPTANCE',
    readyForNextPhase:false, // Never promote from source metadata alone, even if structurally clean.
    phaseTasksAllVerified:open.length===0,
    activePhase:phase, counts, openTaskIds:open.map(t=>t.id),
    errors, blockers,
  };
}

export function inspectCheckout(root) {
  const read = rel => JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
  const phaseState=read('docs/coordination/phase-state.json');
  const workQueue=read('docs/coordination/work-queue.json');
  const lanes=Array.from({length:6},(_,i)=>read('docs/coordination/lanes/chat-0'+(i+1)+'.json'));
  return inspectGate({phaseState,workQueue,lanes});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root=process.argv[2] ? path.resolve(process.argv[2]):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
    const report=inspectCheckout(root);
    console.log(JSON.stringify(report,null,2));
    if (report.errors.length) process.exitCode=2;
  } catch (err) {
    console.error(err);process.exitCode=1;
  }
}
