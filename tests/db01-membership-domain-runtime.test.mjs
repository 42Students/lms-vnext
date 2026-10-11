import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function transpileLocal(relative, dependencies = {}) {
  const source = readFileSync(path.join(root, relative), 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: relative,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const moduleExports = {};
  vm.runInNewContext(compiled.outputText, {
    exports: moduleExports,
    require(moduleName) {
      if (Object.hasOwn(dependencies, moduleName)) return dependencies[moduleName];
      throw new Error(`Unexpected runtime dependency: ${moduleName}`);
    },
  }, { filename: relative });
  return moduleExports;
}

// Source is the REAL application TypeScript, compiled without rewriting its
// business logic. Imports used only as types disappear on transpilation.
const errors = transpileLocal('src/modules/people/errors.ts');
const { getMembershipLifecyclePatch, removeMembershipRoleFromSet } =
  transpileLocal('src/modules/people/membership-domain.ts', { './errors': errors });

const now = new Date('2026-10-11T03:00:00.000Z');
const before = new Date('2026-10-10T03:00:00.000Z');
const active = () => ({ status: 'ACTIVE', suspendedAt: null, suspensionReason: null });
const suspended = () => ({ status: 'SUSPENDED', suspendedAt: before, suspensionReason: 'Policy breach' });

test('actual application SUSPEND creates persisted timestamp and nonblank reason', () => {
  const state = getMembershipLifecyclePatch(active(), { action: 'SUSPEND', reason: 'Policy breach' }, now);
  assert.equal(state.status, 'SUSPENDED');
  assert.strictEqual(state.suspendedAt, now);
  assert.equal(state.suspensionReason, 'Policy breach');
});

test('repeated identical SUSPEND is idempotent', () => {
  assert.equal(getMembershipLifecyclePatch(suspended(), { action: 'SUSPEND', reason: 'Policy breach' }, now), null);
});

test('change in suspension reason preserves first suspension timestamp', () => {
  const state = getMembershipLifecyclePatch(suspended(), { action: 'SUSPEND', reason: 'Updated reason' }, now);
  assert.strictEqual(state.suspendedAt, before);
  assert.equal(state.suspensionReason, 'Updated reason');
});

test('REACTIVATE removes all suspension metadata', () => {
  const state = getMembershipLifecyclePatch(suspended(), { action: 'REACTIVATE' }, now);
  assert.equal(state.status, 'ACTIVE');
  assert.equal(state.suspendedAt, null);
  assert.equal(state.suspensionReason, null);
});

test('REACTIVATE already active is idempotent', () => {
  assert.equal(getMembershipLifecyclePatch(active(), { action: 'REACTIVATE' }, now), null);
});

test('END removes all suspension metadata', () => {
  const state = getMembershipLifecyclePatch(suspended(), { action: 'END' }, now);
  assert.equal(state.status, 'ENDED');
  assert.equal(state.suspendedAt, null);
  assert.equal(state.suspensionReason, null);
});

test('END already ended with clean metadata is idempotent', () => {
  assert.equal(getMembershipLifecyclePatch({ status: 'ENDED', suspendedAt: null, suspensionReason: null }, { action: 'END' }, now), null);
});

test('ENDED membership cannot be suspended', () => {
  assert.throws(() => getMembershipLifecyclePatch({ status: 'ENDED', suspendedAt: null, suspensionReason: null }, { action: 'SUSPEND', reason: 'New reason' }, now), { code: 'MEMBERSHIP_ENDED' });
});

test('ENDED membership cannot be reactivated', () => {
  assert.throws(() => getMembershipLifecyclePatch({ status: 'ENDED', suspendedAt: null, suspensionReason: null }, { action: 'REACTIVATE' }, now), { code: 'MEMBERSHIP_ENDED' });
});

test('cannot drop the final membership role', () => {
  assert.throws(() => removeMembershipRoleFromSet(['LEARNER'], 'LEARNER'), { code: 'LAST_MEMBERSHIP_ROLE' });
});

test('removing one role preserves other membership role', () => {
  assert.deepEqual([...removeMembershipRoleFromSet(['MENTOR','FACULTY'], 'MENTOR')], ['FACULTY']);
});

test('removing a nonexistent role leaves original roles untouched', () => {
  assert.deepEqual([...removeMembershipRoleFromSet(['FACULTY'], 'TPO')], ['FACULTY']);
});
