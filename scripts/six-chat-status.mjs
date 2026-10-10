#!/usr/bin/env node
/**
 * Offline shared-phase six-chat dashboard. No GitHub/network/CI calls are made.
 * Usage: node scripts/six-chat-status.mjs [--lane 1..6] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const laneIndex = args.indexOf('--lane');
const requestedLane = laneIndex < 0 ? null : Number(args[laneIndex + 1]);
const asJson = args.includes('--json');
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/six-chat-status.mjs [--lane 1..6] [--json]');
  process.exit(0);
}
if (args.some((arg) => arg.startsWith('--') && !['--lane', '--json'].includes(arg)) ||
    (laneIndex >= 0 && (!Number.isInteger(requestedLane) || requestedLane < 1 || requestedLane > 6)) ||
    (laneIndex >= 0 && args[laneIndex + 1]?.startsWith('--'))) {
  console.error('Invalid args; use --lane 1..6 and/or --json');
  process.exit(2);
}

const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const phase = load('docs/coordination/phase-state.json');
const queue = load('docs/coordination/work-queue.json');
const chat = [];
const taskIds = new Set();
const counts = {};
const totals = { tasks: 0, verified: 0, retired: 0, ready: 0, claimed: 0, blocked: 0, review: 0 };
const states = new Set(['READY','CLAIMED','BLOCKED','IN_REVIEW','DONE_VERIFIED','RETIRED_APPROVED']);

if (phase.schemaVersion !== 2 || queue.schemaVersion !== 2 ||
    !phase.phaseOrder.includes(phase.currentPhase) ||
    phase.phases[phase.currentPhase]?.state !== 'ACTIVE' ||
    phase.phaseOrder.filter((x) => phase.phases[x]?.state === 'ACTIVE').length !== 1) {
  throw Error('Invalid shared global phase state');
}
for (let i = 1; i <= 6; i += 1) {
  const record = load('docs/coordination/lanes/chat-0' + i + '.json');
  if (record.schemaVersion !== 2 || record.chatNumber !== i || record.issueNumber !== i + 20 ||
      record.workerId !== 'CHAT_0' + i || record.assignment !== 'SHARED_PHASE_WORKER' ||
      record.permanentDomainOwner !== false || record.currentPhase !== phase.currentPhase) {
    throw Error('Invalid or stale Chat ' + i + ' checkpoint');
  }
  chat.push(record);
}
const byTaskId = new Map();
for (const task of queue.tasks) {
  if (taskIds.has(task.id)) throw Error('Duplicate task ID ' + task.id);
  taskIds.add(task.id);
  byTaskId.set(task.id, task);
  if (!states.has(task.status) || !phase.phaseOrder.includes(task.phase)) {
    throw Error('Invalid task state or phase on ' + task.id);
  }
  if (task.status === 'CLAIMED' &&
      (!Number.isInteger(task.claimedBy) || task.claimedBy < 1 || task.claimedBy > 6)) {
    throw Error('Claimed task lacks valid worker: ' + task.id);
  }
  if (task.status !== 'CLAIMED' && task.claimedBy !== null &&
      !['BLOCKED', 'IN_REVIEW', 'DONE_VERIFIED', 'RETIRED_APPROVED'].includes(task.status)) {
    throw Error('Non-claimed task unexpectedly has an owner: ' + task.id);
  }
  counts[task.status] = (counts[task.status] || 0) + 1;
  totals.tasks += 1;
}
for (const task of queue.tasks) {
  for (const d of task.dependsOn || []) {
    if (!byTaskId.has(d)) throw Error('Missing prerequisite ' + d + ' for ' + task.id);
  }
  if (task.status === 'CLAIMED' &&
      chat[task.claimedBy - 1].activeTaskId !== task.id) {
    throw Error('Claim/checkpoint mismatch on ' + task.id);
  }
}
for (const worker of chat) {
  if (worker.activeTaskId &&
      !(byTaskId.get(worker.activeTaskId)?.status === 'CLAIMED' &&
        byTaskId.get(worker.activeTaskId)?.claimedBy === worker.chatNumber)) {
    throw Error('Worker task claim is inconsistent: Chat ' + worker.chatNumber);
  }
}
for (const [state, key] of [['READY','ready'],['CLAIMED','claimed'],['BLOCKED','blocked'],
  ['IN_REVIEW','review'],['DONE_VERIFIED','verified'],['RETIRED_APPROVED','retired']]) {
  totals[key] = counts[state] || 0;
}
const readyFor = (worker) => queue.tasks.filter((task) =>
  task.phase === phase.currentPhase &&
  task.status === 'READY' &&
  (task.restriction === 'ANY' || (task.restriction && worker === 1)) &&
  (task.dependsOn || []).every((id) => ['DONE_VERIFIED','RETIRED_APPROVED'].includes(byTaskId.get(id)?.status))
).sort((a, b) => (a.priority - b.priority) || a.id.localeCompare(b.id)).map((x) => x.id);
const specs = ['learner.md','faculty.md','mentor.md','college-admin.md','super-admin.md','tpo.md','hr.md','shared-public-ops.md'];
const details = { checked: 0, open: 0, partial: 0, total: 0 };
for (const spec of specs) {
  const source = fs.readFileSync(path.join(root, 'docs/parity', spec), 'utf8');
  for (const match of source.matchAll(/^\s*[-*]\s+\[([ xX~])\]\s/gm)) {
    details.total++;
    if (match[1].toLowerCase() === 'x') details.checked++;
    else if (match[1] === '~') details.partial++;
    else details.open++;
  }
}
const activePhaseTasks = queue.tasks.filter((t) => t.phase === phase.currentPhase);
const result = {
  source: 'Local committed files only, no live GitHub/CI checks',
  currentPhase: phase.currentPhase,
  phaseOrder: phase.phaseOrder,
  phaseGate: phase.phases[phase.currentPhase],
  workerCount: chat.length,
  workers: (requestedLane === null ? chat : chat.filter((x) => x.chatNumber === requestedLane)).map((worker) => ({
    chatNumber: worker.chatNumber,
    issueNumber: worker.issueNumber,
    executionState: worker.executionState,
    activeTaskId: worker.activeTaskId,
    verifiedCompletedTaskIds: worker.verifiedCompletedTaskIds,
    reviewTaskIds: worker.reviewTaskIds,
    blockedTaskIds: worker.blockedTaskIds,
    nextEligibleTaskIds: readyFor(worker.chatNumber),
    checkpoint: worker.checkpoint
  })),
  tasks: {
    ...totals,
    currentPhaseTotal: activePhaseTasks.length,
    currentPhaseVerified: activePhaseTasks.filter((x) => x.status === 'DONE_VERIFIED').length,
    currentPhaseApprovedRetirements: activePhaseTasks.filter((x) => x.status === 'RETIRED_APPROVED').length
  },
  historicalDatabaseInventory: phase.globalHistoricalInventorySnapshot,
  detailedPageChecks: details,
  note: 'Queue coverage is not yet certified exhaustive; task percentages are not overall LMS completion.'
};
if (asJson) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
  process.stdout.write('LMS vNext | GLOBAL PHASE: ' + phase.currentPhase +
    ' | ' + activePhaseTasks.length + ' queued packages, ' +
    result.tasks.currentPhaseVerified + ' verified, ' +
    totals.ready + ' ready, ' + totals.claimed + ' claimed, ' +
    totals.blocked + ' blocked, ' + totals.review + ' in review\n\n');
  for (const worker of result.workers) {
    process.stdout.write('Chat ' + worker.chatNumber + ' / issue #' + worker.issueNumber +
      ' | ' + worker.executionState +
      ' | active: ' + (worker.activeTaskId ?? 'none') +
      ' | verified tasks: ' + worker.verifiedCompletedTaskIds.length +
      ' | next eligible: ' + (worker.nextEligibleTaskIds[0] ?? 'none') +
      '\n');
  }
  process.stdout.write('\nDB source inventory (not active schema): ' +
    phase.globalHistoricalInventorySnapshot.tableCandidates + ' table candidates, ' +
    phase.globalHistoricalInventorySnapshot.fieldCandidates + ' field candidates, formal runtime verified: ' +
    phase.globalHistoricalInventorySnapshot.formalRuntimeSemanticVerifiedFields + '\n' +
    'UI detailed historical checklist: ' + details.checked + ' checked, ' +
    details.open + ' open, ' + details.total + ' total.\n' +
    'Refresh GitHub and run real tests before claiming live CI/parity status.\n');
}
