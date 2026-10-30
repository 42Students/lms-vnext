import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditLedgers, auditCheckout, DOMAIN_SUFFIXES, HISTORICAL_FLOOR, FROZEN_LEGACY_ORACLE_SHA } from '../scripts/db19-field-disposition-audit.mjs';

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
test('a self-declared PostgreSQL PASS envelope cannot independently attest runtime acceptance', () => {
  const result = run(ledger('db01_identity_and_tenancy','users', [field('users','id', {
    verifiedMapping: 'users.id', validationEvidence: 'Executed independent Postgres fixture on target SHA',
    databaseAcceptanceEvidence: { kind: 'DISPOSABLE_POSTGRES', sourceCommitSha: 'a'.repeat(40),
      exitCode: 0, result: 'PASS', command: 'psql -X -v ON_ERROR_STOP=1', postgresVersion: '17.4' },
  })]));
  assert.equal(result.sourceInventoryIntegrity, 'FAIL');
  assert.equal(result.counts.runtimeMappings, 0);
  assert.ok(result.errors.some(x => x.code === 'UNSUPPORTED_VERIFIED_MAPPING'));
  assert.equal(result.databaseParityVerified, false);
});
test('multiple forged proof envelopes do not inflate the runtime mapping total', () => {
  const rows = ['PASS', 'PASSED'].map((result, i) => field('users', 'id_' + i, {
    verifiedMapping: 'users.id_' + i,
    validationEvidence: 'Independent PostgreSQL success',
    databaseAcceptanceEvidence: { kind: 'DISPOSABLE_POSTGRES', sourceCommitSha: 'b'.repeat(40),
      exitCode: 0, result, command: 'psql -X', postgresVersion: '17.11' },
  }));
  const report = run(ledger('db01_identity_and_tenancy','users', rows));
  assert.equal(report.counts.runtimeMappings, 0);
  assert.equal(report.errors.filter(e => e.code === 'UNSUPPORTED_VERIFIED_MAPPING').length, 2);
  assert.equal(report.databaseParityVerified, false);
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
    const doc = { domain: domain.toUpperCase(), sourceSha: FROZEN_LEGACY_ORACLE_SHA,
      counts: { tables, fields: expected }, tables: specs };
    const location = path.join(root, 'docs/planning/db-pass4-columns-' + domain + '.json');
    fs.mkdirSync(path.dirname(location), { recursive: true });
    fs.writeFileSync(location, JSON.stringify(doc));
  }
}
test('DB19 rejects a complete synthetic census without independent DB01 review overlays', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'db19-cli-'));
  try {
    writeSyntheticFullInventory(root);
    const proc = spawnSync(process.execPath, [path.resolve(import.meta.dirname,'../scripts/db19-field-disposition-audit.mjs'), root], { encoding:'utf8' });
    const report = JSON.parse(proc.stdout);
    assert.equal(proc.status,2, 'A complete census must not bypass mandatory DB01 source review');
    assert.equal(report.sourceInventoryIntegrity,'FAIL');
    assert.equal(report.counts.domains,11);
    assert.equal(report.counts.tables,199);
    assert.equal(report.counts.fields,2829);
    assert.equal(report.databaseParityVerified,false);
    assert.equal(report.errors.filter(x=>x.code==='MISSING_MANDATORY_DB01_SOURCE_FILE').length,4);
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



test('DB19 rejects balanced cross-domain field drift even when global totals remain 2829', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'db19-balanced-drift-'));
  try {
    writeSyntheticFullInventory(root);
    const db00 = path.join(root, 'docs/planning/db-pass4-columns-db00_historical_and_engine.json');
    const db01 = path.join(root, 'docs/planning/db-pass4-columns-db01_identity_and_tenancy.json');
    const a = JSON.parse(fs.readFileSync(db00, 'utf8'));
    const b = JSON.parse(fs.readFileSync(db01, 'utf8'));
    a.tables[0].rows.pop();
    a.tables[0].sourceFieldCount--;
    a.counts.fields--;
    b.tables[0].rows.push(field(b.tables[0].table, 'extra_new_field'));
    b.tables[0].sourceFieldCount++;
    b.counts.fields++;
    fs.writeFileSync(db00, JSON.stringify(a));
    fs.writeFileSync(db01, JSON.stringify(b));
    const result = auditCheckout(root);
    assert.equal(result.counts.fields, 2829);
    assert.equal(result.counts.tables, 199);
    assert.equal(result.sourceInventoryIntegrity, 'FAIL');
    assert.equal(result.databaseParityVerified, false);
    assert.equal(result.errors.filter(e => e.code === 'FROZEN_DOMAIN_CARDINALITY_DRIFT').length, 2);
    assert.ok(!result.errors.some(e => e.code === 'HISTORICAL_INVENTORY_REGRESSION'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('DB19 rejects balanced cross-domain table drift with unchanged global 199/2829', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'db19-balanced-tables-'));
  try {
    writeSyntheticFullInventory(root);
    const db00 = path.join(root, 'docs/planning/db-pass4-columns-db00_historical_and_engine.json');
    const db01 = path.join(root, 'docs/planning/db-pass4-columns-db01_identity_and_tenancy.json');
    const a = JSON.parse(fs.readFileSync(db00, 'utf8'));
    const b = JSON.parse(fs.readFileSync(db01, 'utf8'));
    const removed = a.tables.pop();
    a.counts.tables--;
    a.counts.fields -= removed.rows.length;
    b.tables.push({ ...removed, table: 'migrated_unrelated_table',
      rows: removed.rows.map(row => ({ ...row, legacyTable: 'migrated_unrelated_table' })) });
    b.counts.tables++;
    b.counts.fields += removed.rows.length;
    fs.writeFileSync(db00, JSON.stringify(a));
    fs.writeFileSync(db01, JSON.stringify(b));
    const result = auditCheckout(root);
    assert.equal(result.counts.fields, 2829);
    assert.equal(result.counts.tables, 199);
    assert.equal(result.sourceInventoryIntegrity, 'FAIL');
    assert.equal(result.errors.filter(e => e.code === 'FROZEN_DOMAIN_CARDINALITY_DRIFT').length, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});


test('DB19 rejects an arbitrary valid-length SHA claiming to be the frozen legacy oracle', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'db19-false-oracle-'));
  try {
    writeSyntheticFullInventory(root);
    const location = path.join(root, 'docs/planning/db-pass4-columns-db07_projects.json');
    const doc = JSON.parse(fs.readFileSync(location, 'utf8'));
    doc.sourceSha = 'a'.repeat(40);
    fs.writeFileSync(location, JSON.stringify(doc));
    const result = auditCheckout(root);
    assert.equal(result.counts.tables, 199);
    assert.equal(result.counts.fields, 2829);
    assert.equal(result.sourceInventoryIntegrity, 'FAIL');
    assert.equal(result.databaseParityVerified, false);
    assert.ok(result.errors.some(e =>
      e.code === 'UNAPPROVED_LEGACY_ORACLE_SHA' &&
      e.path === 'docs/planning/db-pass4-columns-db07_projects.json' &&
      e.expected === FROZEN_LEGACY_ORACLE_SHA));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('DB19 pins an identical but unapproved new source SHA in every domain', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'db19-false-uniform-oracle-'));
  try {
    writeSyntheticFullInventory(root);
    for (const domain of DOMAIN_SUFFIXES) {
      const location = path.join(root, 'docs/planning/db-pass4-columns-' + domain + '.json');
      const doc = JSON.parse(fs.readFileSync(location, 'utf8'));
      doc.sourceSha = 'b'.repeat(40);
      fs.writeFileSync(location, JSON.stringify(doc));
    }
    const result = auditCheckout(root);
    assert.equal(result.counts.fields, 2829);
    assert.equal(result.errors.filter(e => e.code === 'UNAPPROVED_LEGACY_ORACLE_SHA').length, 11);
    assert.ok(!result.errors.some(e => e.code === 'MIXED_LEGACY_ORACLE_SHAS'));
    assert.equal(result.sourceInventoryIntegrity, 'FAIL');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
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
