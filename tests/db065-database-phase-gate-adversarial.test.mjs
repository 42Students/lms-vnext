import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectGate, PHASES } from '../scripts/db065-database-phase-gate.mjs';

const phaseState = () => ({
  currentPhase: 'DATABASE',
  phases: Object.fromEntries(PHASES.map(p => [p, {
    state: p === 'DATABASE' ? 'ACTIVE' : 'LOCKED', certifiedAt: null,
    requiredGates: ['Executed PostgreSQL migration replay'],
  }])),
});
const task = (id, overrides = {}) => ({
  id, phase: 'DATABASE', status: 'READY', dependsOn: [], paths: [],
  restriction: 'ANY', pickedBy: null, completionCommitSha: null,
  verifiedAt: null, verifiedBy: null, verificationEvidence: [], ...overrides,
});
const context = () => ({
  phaseState: phaseState(), workQueue: { phase: 'DATABASE', tasks: [task('DB-201')] },
  lanes: Array.from({ length: 6 }, (_, i) => ({
    chatNumber: i + 1, currentPhase: 'DATABASE', activeTaskId: null,
  })),
});
const claim = (worker, paths) => {
  const x = context();
  x.workQueue.tasks = [task('DB-201', { status: 'IN_PROGRESS', pickedBy: worker, paths })];
  x.lanes[worker - 1].activeTaskId = 'DB-201';
  return x;
};
const codes = x => inspectGate(x).errors.map(e => e.code);
const competingClaim = (a, b) => {
  const x = claim(5, [a]);
  x.workQueue.tasks.push(task('DB-202', { status: 'IN_PROGRESS', pickedBy: 4, paths: [b] }));
  x.lanes[3].activeTaskId = 'DB-202';
  return x;
};

test('global DATABASE refuses API task claims', () => {
  const x = claim(5, ['docs/a.md']);
  x.workQueue.tasks[0].phase = 'API';
  assert.ok(codes(x).includes('ACTIVE_TASK_WRONG_PHASE'));
});
test('non-integrator cannot claim numbered migrations', () => {
  assert.ok(codes(claim(5, ['drizzle/0042.sql'])).includes('PROTECTED_PATH_NOT_CHAT1'));
});
test('non-integrator cannot claim whole drizzle directory', () => {
  assert.ok(codes(claim(5, ['drizzle'])).includes('PROTECTED_PATH_NOT_CHAT1'));
});
test('non-integrator cannot claim schema barrel', () => {
  assert.ok(codes(claim(5, ['src/db/schema/index.ts'])).includes('PROTECTED_PATH_NOT_CHAT1'));
});
test('non-integrator cannot claim root package or workflow directory', () => {
  for (const p of ['package.json', 'package-lock.json', '.github/workflows', '.github/workflows/check.yml'])
    assert.ok(codes(claim(5, [p])).includes('PROTECTED_PATH_NOT_CHAT1'), p);
});
test('Chat 1 may claim protected integration directory', () => {
  assert.deepEqual(codes(claim(1, ['drizzle/**'])), []);
});
test('collision on exact paths fails closed', () => {
  assert.ok(codes(competingClaim('docs/a.md', 'docs/a.md')).includes('ACTIVE_PATH_COLLISION'));
});
test('collision on folder and contained paths fails closed', () => {
  assert.ok(codes(competingClaim('docs/parity', 'docs/parity/a.md')).includes('ACTIVE_PATH_COLLISION'));
});
test('collision on recursive glob and file fails closed', () => {
  assert.ok(codes(competingClaim('docs/parity/**', 'docs/parity/a.md')).includes('ACTIVE_PATH_COLLISION'));
});
test('non-overlapping sibling prefix directories are allowed', () => {
  assert.deepEqual(codes(competingClaim('docs/parity/**', 'docs/parity-other/a.md')), []);
});
test('malformed double slash is rejected before protection check', () => {
  assert.ok(codes(claim(5, ['src/db//schema/index.ts'])).includes('INVALID_TASK_PATHS'));
});
test('path traversal is rejected', () => {
  assert.ok(codes(claim(5, ['docs/../drizzle/0042.sql'])).includes('INVALID_TASK_PATHS'));
});
test('malformed lane collection reports structural error rather than throws', () => {
  const x = context(); x.lanes = {};
  assert.ok(codes(x).includes('MISSING_WORKER_CHECKPOINTS'));
});
test('idle worker on future phase is rejected', () => {
  const x = context(); x.lanes[0].currentPhase = 'API';
  assert.ok(codes(x).includes('LANE_PHASE_MISMATCH'));
});
test('spurious future phase certification is rejected', () => {
  const x = context(); x.phaseState.phases.API.certifiedAt = '2026-10-12T10:00:00Z';
  assert.ok(codes(x).includes('FUTURE_PHASE_PREMATURE_CERTIFICATION'));
});
test('verified metadata cannot contain string worker ID', () => {
  const x = context();
  x.workQueue.tasks = [task('DB-201', { status: 'DONE_VERIFIED',
    completionCommitSha: 'f'.repeat(40), verifiedAt: '2026-10-12', verifiedBy: '5',
    verificationEvidence: [{ command: 'node --test', exitCode: 0 }],
  })];
  assert.ok(codes(x).includes('VERIFIED_WITHOUT_EVIDENCE'));
});
