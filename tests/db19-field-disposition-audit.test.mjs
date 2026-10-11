import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditLedgers, auditCheckout, DOMAIN_SUFFIXES, HISTORICAL_FLOOR } from '../scripts/db19-field-disposition-audit.mjs';

const field = (table, col, overrides = {}) => ({
  legacyTable: table, legacyColumn: col, sourceType: 'varchar(50)',
  sourceEvidence: 'historical-snapshot', reviewStatus: 'UNVERIFIED_FIELD_SEMANTICS',
  verifiedMapping: null, validationEvidence: null, ...overrides,
});
const ledger = (domain, name, rows = [field(name, 'id')]) => ({
  path: 'docs/planning/db-pass4-columns-' + domain + '.json',
  ledger: { domain, counts: { tables: 1, fields: rows.length },
    tables: [{ table: name, sourceFieldCount: rows.length, rows }] },
});
const run = (...inputs) => auditLedgers(inputs, { requireAllDomains: false, enforceFloor: false });

test('clean source ledger is structurally valid without claiming database acceptance', () => {
  const result = run(ledger('db01_identity_and_tenancy', 'users'));
  assert.equal(result.sourceInventoryIntegrity, 'PASS');
  assert.equal(result.databaseParityVerified, false);
  assert.equal(result.counts.runtimeMappings, 0);
  assert.equal(result.counts.uniqueFields, 1);
});
test('rejects duplicate field keys across domains', () => {
  const result = run(ledger('db01_identity_and_tenancy', 'users'), ledger('db05_courses_and_content', 'users'));
  assert.ok(result.errors.some(x => x.code === 'DUPLICATE_FIELD_OWNER'));
  assert.ok(result.errors.some(x => x.code === 'DUPLICATE_TABLE_OWNER'));
});
test('rejects duplicate rows within a table', () => {
  const result = run(ledger('db01_identity_and_tenancy', 'users', [field('users','id'), field('users','id')]));
  assert.ok(result.errors.some(x => x.code === 'DUPLICATE_FIELD_OWNER'));
});
test('rejects table-local count drift even when aggregate counts are updated', () => {
  const input = ledger('db01_identity_and_tenancy','users');
  input.ledger.tables[0].sourceFieldCount = 2;
  assert.ok(run(input).errors.some(x => x.code === 'TABLE_FIELD_COUNT_MISMATCH'));
});
test('rejects top-level ledger count drift', () => {
  const input = ledger('db01_identity_and_tenancy','users');
  input.ledger.counts.fields = 9;
  assert.ok(run(input).errors.some(x => x.code === 'LEDGER_COUNTS_MISMATCH'));
});
test('rejects missing field identity and physical source type', () => {
  const input = ledger('db01_identity_and_tenancy','users', [field('not_users','id'),field('users','name',{sourceType:''})]);
  assert.equal(run(input).errors.filter(x => x.code === 'INVALID_FIELD_IDENTITY').length, 2);
});
test('does not promote a source-reviewed proposal into runtime verified count', () => {
  const result = run(ledger('db03_groups_and_electives','groups', [field('groups','id', {
    reviewStatus:'SOURCE_REVIEWED_MAPPING_PROPOSED', proposedVnextTargets:['groups.id'],
    validationEvidence:'Source reviewed only; runtime not executed',
  })]));
  assert.equal(result.counts.sourceReviewed,1);
  assert.equal(result.counts.proposedMappings,1);
  assert.equal(result.counts.runtimeMappings,0);
});
test('requires positive runtime evidence for verified mappings', () => {
  const result = run(ledger('db01_identity_and_tenancy','users', [field('users','id', {
    verifiedMapping:'users.id', validationEvidence:'source only, PostgreSQL pending',
  })]));
  assert.ok(result.errors.some(x => x.code === 'UNSUPPORTED_VERIFIED_MAPPING'));
});
test('rejects verified status without mapping and evidence', () => {
  const result = run(ledger('db01_identity_and_tenancy','users', [field('users','id', {
    reviewStatus:'DB_TESTED', verifiedMapping: null,
  })]));
  assert.ok(result.errors.some(x => x.code === 'VERIFIED_STATUS_WITHOUT_EVIDENCE'));
});
test('historical retirement candidate remains explicitly pending', () => {
  const result = run(ledger('db00_historical_and_engine','backup', [field('backup','id', {
    reviewStatus:'CLASSIFY_HISTORIC_RETIREMENT',
  })]));
  assert.equal(result.counts.historicRetirementPending,1);
  assert.equal(result.databaseParityVerified,false);
});
test('full-domain and historical floor guards prevent silent source inventory shrinkage', () => {
  const result = auditLedgers([ledger('db01_identity_and_tenancy', 'users')]);
  assert.equal(result.errors.filter(x => x.code === 'MISSING_DOMAIN_LEDGER').length, DOMAIN_SUFFIXES.length-1);
  assert.ok(result.errors.some(x => x.code === 'HISTORICAL_INVENTORY_REGRESSION'));
  assert.deepEqual(HISTORICAL_FLOOR, { tables: 199, fields: 2829 });
});
test('checkout reader finds missing inventories and does not silently pass', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'db19-audit-'));
  try {
    const result = auditCheckout(root);
    assert.equal(result.sourceInventoryIntegrity,'FAIL');
    assert.equal(result.counts.fields,0);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
