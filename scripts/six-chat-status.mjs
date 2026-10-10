#!/usr/bin/env node
/**
 * Shared-phase six-chat queue dashboard; local committed data only, no live CI.
 * Usage:
 *   node scripts/six-chat-status.mjs
 *   node scripts/six-chat-status.mjs --lane 4
 *   node scripts/six-chat-status.mjs --json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const laneIndex = args.indexOf('--lane');
const lane = laneIndex < 0 ? null : Number(args[laneIndex + 1]);
const asJson = args.includes('--json');
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/six-chat-status.mjs [--lane 1..6] [--json]');
  process.exit(0);
}
if (args.some((arg) => arg.startsWith('--') && !['--lane', '--json'].includes(arg)) ||
    (laneIndex >= 0 && (!Number.isInteger(lane) || lane < 1 || lane > 6))) {
  console.error('Invalid args; use --lane 1..6 and/or --json');
  process.exit(2);
}
const load = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const phase = load('docs/coordination/phase-state.json');
const queue = load('docs/coordination/work-queue.json');
const states = new Set(['READY','PICKED','IN_PROGRESS','COMPLETED','BLOCKED','DONE_VERIFIED','RETIRED_APPROVED']);
const blockers = [];
if (queue.schemaVersion !== 3 || phase.schemaVersion !== 2 ||
    phase.phases[phase.currentPhase]?.state !== 'ACTIVE' ||
    phase.phaseOrder.filter((p) => phase.phases[p]?.state === 'ACTIVE').length !== 1) {
  throw Error('Invalid queue schema or global phase');
}
const byTask = new Map();
for (const t of queue.tasks) {
  if (byTask.has(t.id)) throw Error('Duplicate task ID: ' + t.id);
  byTask.set(t.id, t);
  if (!states.has(t.status)) throw Error('Invalid status on ' + t.id + ': ' + t.status);
  if (['PICKED','IN_PROGRESS'].includes(t.status) &&
      (!Number.isInteger(t.pickedBy) || t.pickedBy < 1 || t.pickedBy > 6 || !t.pickedAt)) {
    throw Error('Active task has no picked owner/time: ' + t.id);
  }
  if (['COMPLETED','DONE_VERIFIED'].includes(t.status) &&
      (!t.completedAt || !t.completedBy || !t.completionCommitSha)) {
    throw Error('Completed task is missing completedBy/At/commit: ' + t.id);
  }
  if (t.status === 'DONE_VERIFIED' &&
      (!t.verifiedAt || !t.verifiedBy || t.verificationEvidence?.length === 0)) {
    throw Error('Verified task missing executed test/evidence proof: ' + t.id);
  }
}
for (const task of queue.tasks) {
  for (const d of task.dependsOn || []) if (!byTask.has(d)) throw Error('Missing dependency: ' + d);
}
const workers = [];
for (let i = 1; i <= 6; i++) {
  const w = load('docs/coordination/lanes/chat-0' + i + '.json');
  if (w.schemaVersion !== 3 || w.chatNumber !== i || w.workerId !== 'CHAT_0' + i ||
      w.issueNumber !== 20 + i || w.currentPhase !== phase.currentPhase ||
      !Array.isArray(w.pickedTaskIds) || !Array.isArray(w.completedTaskIds) ||
      !Array.isArray(w.verifiedTaskIds)) {
    throw Error('Invalid/stale worker checkpoint: ' + i);
  }
  const active = queue.tasks.filter((t) => ['PICKED','IN_PROGRESS'].includes(t.status) && t.pickedBy === i);
  if (active.length > 1) throw Error('Worker '+i+' has multiple active tasks');
  if ((w.activeTaskId ?? null) !== (active[0]?.id ?? null)) {
    blockers.push('Worker '+i+' checkpoint/queue mismatch (transient or stale): reconcile before picking');
  }
  const historicallyPicked = queue.tasks.filter((t) => (t.pickHistory || []).some((event) => event.chatNumber === i)).map((t) => t.id);
  const completedByWorker = queue.tasks.filter((t) => t.completedBy === i).map((t) => t.id);
  const verifiedByWorker = queue.tasks.filter((t) => t.verifiedBy === i).map((t) => t.id);
  for (const [label, list, computed] of [
    ['pickedTaskIds',w.pickedTaskIds,historicallyPicked],
    ['completedTaskIds',w.completedTaskIds,completedByWorker],
    ['verifiedTaskIds',w.verifiedTaskIds,verifiedByWorker],
  ]) {
    if ([...new Set([...list,...computed])].length !== list.length || list.length !== computed.length)
      blockers.push('Worker '+i+' '+label+' differs from canonical queue events; reconcile checkpoint');
  }
  const candidates = queue.tasks.filter((t) =>
    t.phase === phase.currentPhase &&
    t.status === 'READY' &&
    (t.restriction === 'ANY' || i === 1) &&
    (t.dependsOn || []).every((d) => ['DONE_VERIFIED','RETIRED_APPROVED'].includes(byTask.get(d)?.status))
  ).sort((a,b)=> a.priority-b.priority || a.id.localeCompare(b.id));
  workers.push({
    chatNumber:i,
    issueNumber:w.issueNumber,
    executionState:w.executionState,
    activeTaskId:w.activeTaskId,
    pickedCount:historicallyPicked.length,
    completedCount:completedByWorker.length,
    verifiedCount:verifiedByWorker.length,
    pickedTaskIds:historicallyPicked,
    completedTaskIds:completedByWorker,
    verifiedTaskIds:verifiedByWorker,
    nextEligibleTaskIds:candidates.map((t)=>t.id),
    checkpoint:w.checkpoint
  });
}
const phaseTasks = queue.tasks.filter((t) => t.phase === phase.currentPhase);
const stateCounts = Object.fromEntries([...states].map((state) => [state, phaseTasks.filter((t)=>t.status===state).length]));
const counts = {
  ...stateCounts,
  currentPhaseTasks:phaseTasks.length,
  everPicked:phaseTasks.filter((t)=>(t.pickHistory?.length ?? 0)>0).length,
  currentlyPickedOrInProgress:stateCounts.PICKED+stateCounts.IN_PROGRESS,
  everCompleted:phaseTasks.filter((t)=>Boolean(t.completedAt)).length,
  completedAwaitingVerification:stateCounts.COMPLETED,
  verified:stateCounts.DONE_VERIFIED,
  ready:stateCounts.READY
};
const specs = ['learner.md','faculty.md','mentor.md','college-admin.md','super-admin.md','tpo.md','hr.md','shared-public-ops.md'];
const detailedPageChecks = {checked:0,open:0,partial:0,total:0};
for (const spec of specs) {
  const text = fs.readFileSync(path.join(root,'docs/parity',spec),'utf8');
  for (const m of text.matchAll(/^\s*[-*]\s+\[([ xX~])\]\s/gm)) {
    detailedPageChecks.total++;
    if (m[1].toLowerCase()==='x') detailedPageChecks.checked++;
    else if(m[1]==='~') detailedPageChecks.partial++;
    else detailedPageChecks.open++;
  }
}
const output = {
  source:'Offline committed repository; live GitHub/CI not queried',
  currentPhase:phase.currentPhase,
  phaseGate:phase.phases[phase.currentPhase],
  taskCounts:counts,
  workers:lane===null?workers:workers.filter((w)=>w.chatNumber===lane),
  historicalDatabaseInventory:phase.globalHistoricalInventorySnapshot,
  detailedPageChecks,
  reconciliationWarnings:blockers,
  metricDefinitions:{
    picked:'A unique task was reserved by this chat at least once, including work not yet finished.',
    completed:'Committed implementation finished by this chat; may be untested/unverified.',
    verified:'Acceptance passed and exact evidence recorded; eligible to close the phase.',
    ready:'Unpicked backlog; dependencies or file claims may prevent immediate assignment.',
    note:'Never add worker picked counts to compute distinct global tasks if tasks can be reassigned.'
  }
};
if(asJson) console.log(JSON.stringify(output,null,2));
else {
  console.log('LMS vNext | Active global phase: '+phase.currentPhase);
  console.log('Tasks: '+counts.currentPhaseTasks+' total | '+counts.ready+' READY | '+counts.PICKED+
    ' PICKED | '+counts.IN_PROGRESS+' IN_PROGRESS | '+counts.completedAwaitingVerification+
    ' COMPLETED (unverified) | '+counts.verified+' VERIFIED | '+counts.BLOCKED+' BLOCKED');
  console.log('Lifetime distinct tasks: '+counts.everPicked+' ever picked; '+counts.everCompleted+
    ' implementation completed; '+counts.verified+' verified.');
  console.log('');
  console.log('Worker      Picked   Completed   Verified   Active task    Next eligible');
  for (const w of output.workers) {
    console.log(('Chat '+w.chatNumber).padEnd(12)+String(w.pickedCount).padEnd(9)+
      String(w.completedCount).padEnd(12)+String(w.verifiedCount).padEnd(11)+
      String(w.activeTaskId??'-').padEnd(15)+(w.nextEligibleTaskIds[0]??'-'));
  }
  console.log('');
  console.log('Historical DB candidates: '+phase.globalHistoricalInventorySnapshot.tableCandidates+
    ' tables, '+phase.globalHistoricalInventorySnapshot.fieldCandidates+
    ' fields; formally runtime-verified fields: '+phase.globalHistoricalInventorySnapshot.formalRuntimeSemanticVerifiedFields);
  console.log('Detailed UI checks: '+detailedPageChecks.checked+' checked / '+detailedPageChecks.total+
    ' (not necessarily browser-verified).');
  for(const issue of blockers) console.warn('COORDINATION WARNING: '+issue);
  console.log('NOTE: This is an offline snapshot; inspect live GitHub and CI to report current progress.');
}

