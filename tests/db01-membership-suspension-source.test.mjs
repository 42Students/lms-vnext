import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const proposal = read('docs/planning/sql/db01-membership-suspension-state-staging.sql');
const lifecycle = read('src/modules/people/membership-domain.ts');
const registered = read('src/db/schema/memberships.ts');
const validation = read('src/modules/people/validation.ts');

function activeSql(source) {
  return source.replace(/^\s*--.*$/gm, '').replace(/\s+/g, ' ');
}

function violations(rawSql) {
  const sql = activeSql(rawSql);
  const problems = [];
  for (const [pattern, label] of [
    [/ALTER TABLE college_memberships\s+ADD CONSTRAINT college_memberships_suspension_state_ck\s+CHECK\s*\(/i, 'state check'],
    [/status = 'SUSPENDED'\s+AND suspended_at IS NOT NULL/i, 'suspended timestamp'],
    [/AND suspension_reason IS NOT NULL\s+AND char_length\(btrim\(suspension_reason\)\) BETWEEN 1 AND 1000/i, 'bounded nonblank reason'],
    [/status IN \('ACTIVE', 'ENDED'\)\s+AND suspended_at IS NULL\s+AND suspension_reason IS NULL/i, 'active/ended metadata clearing'],
  ]) {
    if (!pattern.test(sql)) problems.push(label);
  }
  if (/\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bTRUNCATE\b/i.test(sql)) problems.push('destructive DML');
  if (/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER/i.test(sql)) problems.push('unapproved terminality trigger');
  return problems;
}

test('staged SQL enforces the suspension state shape and contains no destructive operations', () => {
  assert.deepEqual(violations(proposal), []);
});

test('proposal concerns real unconstrained columns in the registered membership schema', () => {
  assert.match(registered, /membershipStatusEnum\("status"\)/);
  assert.match(registered, /suspendedAt: timestamp\("suspended_at"/);
  assert.match(registered, /suspensionReason: text\("suspension_reason"\)/);
  assert.doesNotMatch(registered, /college_memberships_suspension_state_ck/);
});

test('application producer has all three transitions and clears metadata on reactivation and end', () => {
  assert.match(lifecycle, /case "SUSPEND"/);
  assert.match(lifecycle, /case "REACTIVATE"/);
  assert.match(lifecycle, /case "END"/);
  assert.match(lifecycle, /status: "SUSPENDED",\s*suspendedAt: state\.suspendedAt \?\? now,\s*suspensionReason: input\.reason/);
  for (const status of ['ACTIVE', 'ENDED']) {
    assert.match(lifecycle, new RegExp(`status: "${status}",\\s*suspendedAt: null,\\s*suspensionReason: null`));
  }
  assert.match(validation, /\.max\(1000,/);
});

test('mutation: removing active/ended metadata clearing becomes visible', () => {
  const mutated = proposal.replace("status IN ('ACTIVE', 'ENDED')", "status = 'ACTIVE'");
  assert.ok(violations(mutated).includes('active/ended metadata clearing'));
});

test('mutation: allowing blank suspension reason becomes visible', () => {
  const mutated = proposal.replace('char_length(btrim(suspension_reason)) BETWEEN 1 AND 1000', 'true');
  assert.ok(violations(mutated).includes('bounded nonblank reason'));
});

test('mutation: missing suspended timestamp becomes visible', () => {
  const mutated = proposal.replace('suspended_at IS NOT NULL', 'true');
  assert.ok(violations(mutated).includes('suspended timestamp'));
});

test('mutation: destructive cleanup is rejected even if comments claim staging', () => {
  const mutated = `${proposal}\nTRUNCATE college_memberships;`;
  assert.ok(violations(mutated).includes('destructive DML'));
});

test('mutation: reenrollment trigger is rejected until product policy is decided', () => {
  const mutated = `${proposal}\nCREATE TRIGGER forbid_ended_reactivate BEFORE UPDATE ON college_memberships EXECUTE PROCEDURE no_reactivate();`;
  assert.ok(violations(mutated).includes('unapproved terminality trigger'));
});
