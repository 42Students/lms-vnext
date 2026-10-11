import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proposal = readFileSync(path.join(root, 'docs/planning/sql/db01-tenant-domain-tombstone-staging.sql'), 'utf8');
const activeSchema = readFileSync(path.join(root, 'src/db/schema/tenant-domains.ts'), 'utf8');

function activeSql(source) {
  return source.replace(/^\s*--.*$/gm, '').replace(/\s+/g, ' ');
}

function contractViolations(rawSql, registeredSchema) {
  const sql = activeSql(rawSql);
  const problems = [];
  const requires = [
    [/ALTER TABLE tenant_domains\s+ADD COLUMN deleted_at timestamptz\s*;/i, 'deleted_at storage'],
    [/ADD COLUMN deleted_by_user_id uuid\s+REFERENCES users\(id\) ON DELETE RESTRICT\s*;/i, 'deletion actor reference'],
    [/ADD COLUMN deletion_reason text\s*;/i, 'deletion reason'],
    [/CONSTRAINT tenant_domains_deleted_nonprimary_ck\s+CHECK\s*\(deleted_at IS NULL OR is_primary = false\)/i, 'deleted domain cannot remain primary'],
    [/CONSTRAINT tenant_domains_deletion_metadata_ck\s+CHECK\s*\(\s*deleted_at IS NOT NULL\s+OR \(deleted_by_user_id IS NULL AND deletion_reason IS NULL\)\s*\)/i, 'deletion metadata shape'],
    [/CREATE INDEX tenant_domains_active_college_idx\s+ON tenant_domains\s*\(college_id, is_primary, is_verified\)\s+WHERE deleted_at IS NULL\s*;/i, 'active partial index'],
  ];
  for (const [pattern, label] of requires) {
    if (!pattern.test(sql)) problems.push(`missing ${label}`);
  }
  if (/\bDROP\s+INDEX\b/i.test(sql)) problems.push('destructive index drop');
  if (/\bDELETE\s+FROM\s+tenant_domains\b/i.test(sql)) problems.push('destructive row deletion');
  if (!/uniqueIndex\("tenant_domains_host_uq"\)\.on\(sql`lower\(\$\{table\.host\}\)`\)/.test(registeredSchema)) {
    problems.push('existing case-insensitive global host index not confirmed');
  }
  if (/\b(?:CREATE|ALTER)\s+(?:UNIQUE\s+)?INDEX\b[^;]*tenant_domains_host_uq\b/i.test(sql)) {
    problems.push('unapproved change to global host uniqueness');
  }
  return problems;
}

test('staged SQL preserves deletion history and all owner/state guards', () => {
  assert.deepEqual(contractViolations(proposal, activeSchema), []);
});

test('the existing registered host uniqueness is still global and case-insensitive', () => {
  assert.match(activeSchema, /uniqueIndex\("tenant_domains_host_uq"\)\.on\(sql`lower\(\$\{table\.host\}\)`\)/);
  assert.doesNotMatch(activeSql(proposal), /\bDROP\s+INDEX\b/i);
});

test('guard catches removal of deleted-domain nonprimary invariant', () => {
  const mutated = proposal.replace('deleted_at IS NULL OR is_primary = false', 'true');
  assert.ok(contractViolations(mutated, activeSchema).includes('missing deleted domain cannot remain primary'));
});

test('guard catches unsafe hostname-index replacement even if mentioned in comments', () => {
  const mutated = `${proposal}\nDROP INDEX tenant_domains_host_uq;`;
  assert.ok(contractViolations(mutated, activeSchema).includes('destructive index drop'));
});

test('guard catches removal of required actor/tenant deletion metadata shape', () => {
  const mutated = proposal.replace('deleted_by_user_id IS NULL AND deletion_reason IS NULL', 'true');
  assert.ok(contractViolations(mutated, activeSchema).includes('missing deletion metadata shape'));
});

test('guard catches removal of active-query-only partial index', () => {
  const mutated = proposal.replace('WHERE deleted_at IS NULL;', 'WHERE true;');
  assert.ok(contractViolations(mutated, activeSchema).includes('missing active partial index'));
});
