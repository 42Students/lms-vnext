import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditDb019SemanticDecisions, loadDb019SemanticDecisions} from '../scripts/db019-semantic-decision-quality.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL('../docs/planning/' + name, import.meta.url), 'utf8'));
const db02 = read('db-pass4-columns-db02_academics_and_timetable.json');
const db09Source = read('db-pass4-columns-db09_tpo_and_recruiter_operations.json');
const db09 = read('database-parity-db09-field-ledger.json');
const audit = (a=db02,b=db09Source,c=db09) => auditDb019SemanticDecisions(a,b,c);
const detects = (report, code) => assert.ok(
  report.errors.some(error => error.code === code),
  'expected ' + code + ' in ' + JSON.stringify(report.errors.slice(0,4)));

test('actual 404 source fields have explicit DB02 and DB09 decision narratives, not runtime proof', () => {
  const report = loadDb019SemanticDecisions();
  assert.equal(report.valid, true);
  assert.equal(report.reviewedSourceFields, 404);
  assert.deepEqual(report.db02, {
    sourceFields:125, explicitSourceDecisions:101,
    retirementCandidatesStillPendingApproval:24, runtimeMappingsVerified:0,
  });
  assert.deepEqual(report.db09, {
    sourceFields:279, mappedSourceDecisions:195,
    redesignedSourceDecisions:84, runtimeMappingsVerified:0,
  });
  assert.equal(report.sourceOnly, true);
  assert.equal(report.runtimeVerified, false);
  assert.equal(report.acceptanceReady, false);
});

test('academic source decision cannot pass without a justified target rationale', () => {
  const changed = structuredClone(db02);
  changed.tables[0].rows[0].db02SourceReview.vnextTargetDisposition.rationale = '';
  detects(audit(changed), 'DB02_MISSING_FIELD_DISPOSITION_OR_RATIONALE');
});
test('academic source decision cannot fake executed Postgres evidence', () => {
  const changed = structuredClone(db02);
  changed.tables[0].rows[0].db02SourceReview.vnextTargetDisposition.postgresStatus = 'PASS';
  detects(audit(changed), 'DB02_UNSUPPORTED_RUNTIME_PROMOTION');
});
test('academic source identity cannot be duplicated or missing', () => {
  const changed = structuredClone(db02);
  changed.tables[0].rows[1].legacyColumn = changed.tables[0].rows[0].legacyColumn;
  detects(audit(changed), 'DB02_MISSING_DUPLICATE_OR_MISOWNED_FIELD');
});
test('academic candidate retirement is never counted as approved', () => {
  const report = audit();
  assert.equal(report.db02.retirementCandidatesStillPendingApproval, 24);
  assert.equal(report.acceptanceReady, false);
});
test('DB09 source oracle mismatch fails even when field names remain identical', () => {
  const changed = structuredClone(db09);
  changed.legacyBackendSha = '0'.repeat(40);
  detects(audit(db02,db09Source,changed), 'FROZEN_LEGACY_ORACLE_DRIFT');
});
test('DB09 rejected when a mapped field loses its tenant policy', () => {
  const changed = structuredClone(db09);
  changed.records[0].tenantKey = null;
  detects(audit(db02,db09Source,changed), 'DB09_MISSING_SEMANTIC_DECISION_OR_EVIDENCE');
});
test('DB09 rejected when field loses its consumer path', () => {
  const changed = structuredClone(db09);
  changed.records[0].consumerPaths = [];
  detects(audit(db02,db09Source,changed), 'DB09_MISSING_SEMANTIC_DECISION_OR_EVIDENCE');
});
test('DB09 rejects changed source type regardless of reviewed decision text', () => {
  const changed = structuredClone(db09);
  changed.records[0].legacySqlType = 'forged';
  detects(audit(db02,db09Source,changed), 'DB09_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT');
});
test('DB09 refuses fabricated runtime verification evidence', () => {
  const changed = structuredClone(db09);
  changed.records[0].dbTestEvidence = ['PG17 success asserted without a run'];
  detects(audit(db02,db09Source,changed), 'DB09_UNSUPPORTED_RUNTIME_PROMOTION');
});
test('DB09 refuses duplicate field receipts', () => {
  const changed = structuredClone(db09);
  changed.records[1].legacyColumn = changed.records[0].legacyColumn;
  changed.records[1].legacyTable = changed.records[0].legacyTable;
  detects(audit(db02,db09Source,changed), 'DB09_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT');
});
test('DB09 census drops fail rather than silently reducing denominator', () => {
  const changed = structuredClone(db09);
  changed.records.pop();
  detects(audit(db02,db09Source,changed), 'DB09_CENSUS_OR_VERIFICATION_DRIFT');
});
