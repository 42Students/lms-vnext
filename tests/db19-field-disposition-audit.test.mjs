import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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

test('malformed evidence must never upgrade an alleged mapping into runtime verified', () => {
  const result = run(ledger('db01_identity_and_tenancy','users', [field('users','id', {
    verifiedMapping: 'users.id', validationEvidence: 'PostgreSQL success',
    databaseAcceptanceEvidence: { kind: 'DISPOSABLE_POSTGRES', sourceCommitSha: 'deadbeef', exitCode: 0,
      result: 'PASS', command: 'psql', postgresVersion: '17' },
  })]));
  assert.equal(result.counts.runtimeMappings, 0);
  assert.ok(result.errors.some(x => x.code === 'UNSUPPORTED_VERIFIED_MAPPING'));
});
test('executed proof envelope distinguishes verified mapping from a source-only proposal', () => {
  const result = run(ledger('db01_identity_and_tenancy','users', [field('users','id', {
    verifiedMapping: 'users.id', validationEvidence: 'Executed independent Postgres fixture on target SHA',
    databaseAcceptanceEvidence: { kind: 'DISPOSABLE_POSTGRES', sourceCommitSha: 'a'.repeat(40),
      exitCode: 0, result: 'PASS', command: 'psql -X -v ON_ERROR_STOP=1', postgresVersion: '17.4' },
  })]));
  assert.equal(result.sourceInventoryIntegrity, 'PASS');
  assert.equal(result.counts.runtimeMappings, 1);
  assert.equal(result.databaseParityVerified, false);
});
test('missing field source provenance is a structural error, not just a warning count', () => {
  const result = run(ledger('db01_identity_and_tenancy','users', [field('users','id', { sourceEvidence: null })]));
  assert.equal(result.counts.rowsMissingSourceEvidence, 1);
  assert.ok(result.errors.some(x => x.code === 'FIELD_WITHOUT_SOURCE_EVIDENCE'));
});
test('full-domain audit rejects mixed frozen legacy oracle SHAs', () => {
  const entries = DOMAIN_SUFFIXES.map((suffix,i) => {
    const entry = ledger(suffix, 'table_' + i);
    entry.ledger.domain = suffix.toUpperCase();
    entry.ledger.sourceSha = i === 0 ? 'a'.repeat(40) : 'b'.repeat(40);
    return entry;
  });
  const result = auditLedgers(entries, { enforceFloor: false });
  assert.ok(result.errors.some(x => x.code === 'MIXED_LEGACY_ORACLE_SHAS'));
});
test('full-domain audit rejects mismatched filename/domain identity', () => {
  const entries = DOMAIN_SUFFIXES.map((suffix,i) => {
    const entry = ledger(suffix,'table_'+i);
    entry.ledger.domain = suffix.toUpperCase();
    entry.ledger.sourceSha = 'c'.repeat(40);
    return entry;
  });
  entries[0].ledger.domain = 'DB00_WRONG_DOMAIN';
  const result = auditLedgers(entries, { enforceFloor: false });
  assert.ok(result.errors.some(x => x.code === 'DOMAIN_FILENAME_MISMATCH'));
});
test('full-domain audit rejects unpinned source oracles', () => {
  const entries = DOMAIN_SUFFIXES.map((suffix,i) => {
    const entry = ledger(suffix,'table_'+i);
    entry.ledger.domain = suffix.toUpperCase();
    entry.ledger.sourceSha = 'c'.repeat(40);
    return entry;
  });
  entries[3].ledger.sourceSha = 'moving-main';
  const result = auditLedgers(entries, { enforceFloor: false });
  assert.ok(result.errors.some(x => x.code === 'INVALID_SOURCE_ORACLE_SHA'));
});

const DOMAIN_SHAPES = [
  [39,732],[22,312],[13,125],[6,79],[7,103],[7,92],
  [21,248],[16,358],[18,280],[31,279],[19,221],
];
function writeSyntheticFullInventory(root, subtractOneField = false) {
  for (let d = 0; d < DOMAIN_SUFFIXES.length; d++) {
    const domain = DOMAIN_SUFFIXES[d];
    const [tables, fields] = DOMAIN_SHAPES[d];
    const expected = fields - (subtractOneField && d === 0 ? 1 : 0);
    const base = Math.floor(expected / tables);
    const extra = expected % tables;
    const specs = Array.from({ length: tables }, (_, t) => {
      const name = 'domain_' + d + '_table_' + t;
      const rows = Array.from({ length: base + (t < extra ? 1 : 0) }, (_, f) => field(name,'field_'+f));
      return { table: name, sourceFieldCount: rows.length, rows };
    });
    const doc = { domain: domain.toUpperCase(), sourceSha: 'a'.repeat(40),
      counts: { tables, fields: expected }, tables: specs };
    const location = path.join(root, 'docs/planning/db-pass4-columns-' + domain + '.json');
    fs.mkdirSync(path.dirname(location), { recursive: true });
    fs.writeFileSync(location, JSON.stringify(doc));
  }
}
test('DB19 CLI accepts complete independent synthetic 11-domain 2829-field inventory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'db19-cli-'));
  try {
    writeSyntheticFullInventory(root);
    const proc = spawnSync(process.execPath, [path.resolve(import.meta.dirname,'../scripts/db19-field-disposition-audit.mjs'), root], { encoding:'utf8' });
    assert.equal(proc.status,0,proc.stderr);
    const report = JSON.parse(proc.stdout);
    assert.equal(report.sourceInventoryIntegrity,'PASS');
    assert.equal(report.counts.domains,11);
    assert.equal(report.counts.tables,199);
    assert.equal(report.counts.fields,2829);
    assert.equal(report.databaseParityVerified,false);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('DB19 CLI rejects 2828-field inventory even if all internal counters agree', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'db19-cli-loss-'));
  try {
    writeSyntheticFullInventory(root,true);
    const proc = spawnSync(process.execPath, [path.resolve(import.meta.dirname,'../scripts/db19-field-disposition-audit.mjs'), root], { encoding:'utf8' });
    assert.equal(proc.status,2,proc.stderr);
    const report = JSON.parse(proc.stdout);
    assert.ok(report.errors.some(x => x.code === 'HISTORICAL_INVENTORY_REGRESSION'));
    assert.equal(report.counts.fields,2828);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});


test('DB19 source inventory projects approved DB00 backup dispositions without runtime verification', () => {
  const input = ledger('db00_historical_and_engine','backup', [field('backup','id',{reviewStatus:'CLASSIFY_HISTORIC_RETIREMENT'})]);
  input.ledger.domain='DB00_HISTORICAL_AND_ENGINE';input.ledger.sourceSha='f'.repeat(40);
  input.ledger.tables[0].sourceTableClass='HISTORICAL_BACKUP_VALIDATE_RETIREMENT';
  const review={domain:'DB00_HISTORICAL_AND_ENGINE',legacyOracleSha:'f'.repeat(40),
    counts:{candidateTables:1,candidateFields:1,tableDispositionsClosed:1,fieldCandidatesDispositionedByTableDecision:1,pendingProductDecisionTables:0,pendingProductDecisionFields:0},
    tables:[{table:'backup',sourceClass:'HISTORICAL_BACKUP_VALIDATE_RETIREMENT',sourceFieldCount:1,disposition:'RETIRE_GREENFIELD_BACKUP'}]};
  const result=auditLedgers([input], {requireAllDomains:false,enforceFloor:false,db00Disposition:review});
  assert.equal(result.sourceInventoryIntegrity,'PASS');
  assert.equal(result.counts.backupFieldsSourceDisposed,1);
  assert.equal(result.counts.smrithiFieldsPendingProductDecision,0);
  assert.equal(result.counts.runtimeMappings,0);
  assert.equal(result.databaseParityVerified,false);
});
test('DB19 rejects a falsified DB00 source disposition rather than reclassifying Smrithi', () => {
  const input = ledger('db00_historical_and_engine','smrithi_application');
  input.ledger.domain='DB00_HISTORICAL_AND_ENGINE';input.ledger.sourceSha='f'.repeat(40);
  input.ledger.tables[0].sourceTableClass='LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION';
  const review={domain:'DB00_HISTORICAL_AND_ENGINE',legacyOracleSha:'f'.repeat(40),
    counts:{candidateTables:1,candidateFields:1,tableDispositionsClosed:1,fieldCandidatesDispositionedByTableDecision:1,pendingProductDecisionTables:0,pendingProductDecisionFields:0},
    tables:[{table:'smrithi_application',sourceClass:'LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION',sourceFieldCount:1,disposition:'RETIRE_GREENFIELD_BACKUP'}]};
  const result=auditLedgers([input], {requireAllDomains:false,enforceFloor:false,db00Disposition:review});
  assert.equal(result.sourceInventoryIntegrity,'FAIL');
  assert.ok(result.errors.some(e=>e.code==='DB00_DISPOSITION_DISPOSITION_MISMATCH'));
  assert.equal(result.counts.smrithiFieldsPendingProductDecision,null);
});
test('DB19 without owner disposition does not invent approval', () => {
  const result=run(ledger('db01_identity_and_tenancy','users'));
  assert.equal(result.db00DispositionOverlay,null);
  assert.equal(result.counts.smrithiFieldsPendingProductDecision,null);
});
