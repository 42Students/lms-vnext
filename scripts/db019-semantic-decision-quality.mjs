#!/usr/bin/env node
// DB-019 independently checks source-level semantic dispositions in DB02 and DB09.
// This is NOT a PostgreSQL, producer/consumer, retirement or global phase certificate.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ORACLE = '21bad59d4dfaf2fa11fdeaf9353327ce105697d5';
const required = value => typeof value === 'string' && value.trim().length > 0;
const key = (table, field) => required(table) && required(field) ? table + '.' + field : null;

export function auditDb019SemanticDecisions(db02, db09Source, db09Review) {
  const errors = [];
  const fail = (code, field = null) => errors.push({code, ...(field === null ? {} : {field})});
  const result = {sourceOnly: true, runtimeVerified: false, acceptanceReady: false};
  if (!db02 || !Array.isArray(db02.tables) || !db09Source ||
      !Array.isArray(db09Source.tables) || !db09Review ||
      !Array.isArray(db09Review.records)) {
    return {...result, valid:false, errors:[{code:'INVALID_INPUT'}]};
  }
  if (db02.sourceSha !== ORACLE || db09Source.sourceSha !== ORACLE ||
      db09Review.legacyBackendSha !== ORACLE) fail('FROZEN_LEGACY_ORACLE_DRIFT');
  const academic = db02.tables.flatMap(table => (table.rows || []).map(row => ({table, row})));
  const recruitment = db09Source.tables.flatMap(table => (table.rows || []).map(row => ({table, row})));
  if (db02.tables.length !== 13 || academic.length !== 125 ||
      db02.counts?.fields !== 125 || db02.counts?.tables !== 13)
    fail('DB02_CENSUS_DRIFT');
  if (db09Source.tables.length !== 31 || recruitment.length !== 279 ||
      db09Source.counts?.fields !== 279 || db09Source.counts?.tables !== 31 ||
      db09Review.records.length !== 279 || db09Review.totalFieldCount !== 279 ||
      db09Review.reviewedFieldCount !== 279 || db09Review.verifiedFieldCount !== 0 ||
      db09Review.sourceOnly !== true) fail('DB09_CENSUS_OR_VERIFICATION_DRIFT');

  let db02Explicit = 0, db02PendingRetirement = 0;
  const academicIds = new Set();
  for (const {table, row} of academic) {
    const field = key(row?.legacyTable, row?.legacyColumn);
    if (!field || row.legacyTable !== table.table || academicIds.has(field)) {
      fail('DB02_MISSING_DUPLICATE_OR_MISOWNED_FIELD', field); continue;
    }
    academicIds.add(field);
    const review = row.db02SourceReview;
    const semantic = review?.sourceSemanticDisposition;
    const target = review?.vnextTargetDisposition;
    if (!required(semantic?.kind) || !required(semantic?.proof) ||
        !required(semantic?.source) || !required(target?.kind) ||
        !required(target?.target) || !required(target?.rationale) ||
        !required(target?.decisionId)) {
      fail('DB02_MISSING_FIELD_DISPOSITION_OR_RATIONALE', field); continue;
    }
    if (row.verifiedMapping != null || review.semanticProof !== 'NOT_PROVEN' ||
        review.dbConstraintProof !== 'NOT_EXECUTED' ||
        review.producerConsumerProof !== 'NOT_EXECUTED' ||
        target.postgresStatus !== 'NOT_EXECUTED' ||
        !['NOT_RUNTIME_VERIFIED','NOT_EXECUTED'].includes(target.semanticEquivalenceStatus) ||
        !['DESIGN_DISPOSITION_ONLY','UNREGISTERED_STAGING',
          'UNREGISTERED_OR_EXISTING_TARGET_NOT_RUNTIME_VERIFIED'].includes(target.registrationStatus))
      fail('DB02_UNSUPPORTED_RUNTIME_PROMOTION', field);
    const needsRetirementApproval = /HISTORICAL|RETIREMENT/.test(semantic.kind + ' ' + target.kind);
    if (needsRetirementApproval) db02PendingRetirement++;
    else db02Explicit++;
  }
  const sourceRows = new Map();
  for (const {table, row} of recruitment) {
    const field = key(row?.legacyTable, row?.legacyColumn);
    if (!field || table.table !== row.legacyTable || sourceRows.has(field))
      fail('DB09_DUPLICATE_OR_INVALID_SOURCE_FIELD', field);
    else sourceRows.set(field, row);
  }
  let db09Mapped = 0, db09Redesigned = 0;
  const reviewed = new Set();
  for (const row of db09Review.records) {
    const field = key(row?.legacyTable, row?.legacyColumn);
    const original = sourceRows.get(field);
    if (!field || reviewed.has(field) || !original ||
        original.sourceType !== row.legacySqlType) {
      fail('DB09_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT', field); continue;
    }
    reviewed.add(field);
    if (!['MAPPED','REDESIGNED'].includes(row.status) ||
        !required(row.semanticDefinition) || !required(row.tenantKey) ||
        !required(row.actorPermission) ||
        !required(row.constraintAndLifecycleEvidence) ||
        !required(row.mappingTarget?.status) && !required(row.mappingTarget?.table) ||
        !Array.isArray(row.producerPaths) || row.producerPaths.length === 0 ||
        !Array.isArray(row.consumerPaths) || row.consumerPaths.length === 0 ||
        row.producerPaths.some(x => !required(x)) ||
        row.consumerPaths.some(x => !required(x)) ||
        row.reviewedAtLegacySha !== ORACLE) {
      fail('DB09_MISSING_SEMANTIC_DECISION_OR_EVIDENCE', field); continue;
    }
    if (!Array.isArray(row.dbTestEvidence) || row.dbTestEvidence.length ||
        !Array.isArray(row.workflowEvidence) || row.workflowEvidence.length)
      fail('DB09_UNSUPPORTED_RUNTIME_PROMOTION', field);
    if (row.status === 'MAPPED') db09Mapped++;
    else db09Redesigned++;
  }
  for (const field of sourceRows.keys()) if (!reviewed.has(field))
    fail('DB09_SOURCE_FIELD_UNREVIEWED', field);
  return {...result,valid:errors.length === 0,errors,
    reviewedSourceFields:academic.length + recruitment.length,
    db02:{sourceFields:academic.length,explicitSourceDecisions:db02Explicit,
      retirementCandidatesStillPendingApproval:db02PendingRetirement,
      runtimeMappingsVerified:0},
    db09:{sourceFields:recruitment.length,mappedSourceDecisions:db09Mapped,
      redesignedSourceDecisions:db09Redesigned,runtimeMappingsVerified:0},
    remainingGates:[
      'DB02 historical/retirement candidates require explicit approved disposition',
      'Source mapping names and narratives do not prove registered PostgreSQL storage or parity',
      'Independently execute tenant, permissions, producer/consumer, state and race witnesses',
      'All other DB019 domains and DB020 global phase gate remain separately open'
    ]};
}

// DB07 project field reviews contain explicit historical source dispositions,
// but 358/358 remain semantically and runtime unverified. Surface gaps without
// mistaking generic normalized target hints for completed field mappings.
export function auditDb019ProjectDecisions(source, review) {
  const errors = [];
  const fail = (code, field = null) => errors.push({code, ...(field === null ? {} : {field})});
  if (!source || !Array.isArray(source.tables) || !review ||
      !Array.isArray(review.tables))
    return {valid:false, errors:[{code:'INVALID_PROJECT_INPUT'}], sourceOnly:true};
  if (source.sourceSha !== ORACLE || review.legacyBackendSha !== ORACLE)
    fail('DB07_LEGACY_ORACLE_DRIFT');
  const sourceFields = new Map();
  for (const table of source.tables) for (const row of table.rows || []) {
    const field = key(row?.legacyTable,row?.legacyColumn);
    if (!field || row.legacyTable !== table.table || sourceFields.has(field))
      fail('DB07_INVALID_OR_DUPLICATE_SOURCE', field);
    else sourceFields.set(field,row);
  }
  const seen = new Set();
  let targetGapOrUndecided = 0;
  for (const table of review.tables) for (const row of table.fields || []) {
    const field = key(table.legacyTable,row.legacyField);
    const original = sourceFields.get(field);
    if (!field || seen.has(field) || !original ||
        original.sourceType !== row.sourceType) {
      fail('DB07_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT', field); continue;
    }
    seen.add(field);
    if (!required(row.decision) || !required(row.reason) ||
        (!required(row.targetRef) && row.decision !== 'SECURITY_REDESIGN_REQUIRED'))
      fail('DB07_MISSING_DECISION_RATIONALE_OR_TARGET',field);
    if (row.runtimeVerified !== false || row.semanticVerified !== false ||
        row.validationEvidence != null)
      fail('DB07_FALSE_RUNTIME_VERIFICATION',field);
    if (/^TARGET_GAP|DECISION_REQUIRED/.test(row.decision))
      targetGapOrUndecided++;
  }
  for (const field of sourceFields.keys()) if (!seen.has(field))
    fail('DB07_SOURCE_FIELD_UNREVIEWED',field);
  if (source.tables.length !== 16 || review.tables.length !== 16 ||
      sourceFields.size !== 358 || seen.size !== 358 ||
      review.counts?.fieldDispositions !== 358 ||
      review.counts?.semanticVerifiedFields !== 0 ||
      review.counts?.runtimeVerifiedFields !== 0 ||
      review.counts?.approvedRetirements !== 0)
    fail('DB07_CENSUS_OR_VERIFICATION_DRIFT');
  return {valid:errors.length===0,errors,sourceOnly:true,
    sourceFields:sourceFields.size,sourceDispositionRows:seen.size,
    targetGapsOrFieldDecisionsPending:targetGapOrUndecided,
    runtimeMappingsVerified:0,approvedRetirements:0,acceptanceReady:false};
}

export function loadDb019SemanticDecisions(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const read = name => JSON.parse(fs.readFileSync(path.join(root,'docs/planning',name),'utf8'));
  const base = auditDb019SemanticDecisions(
    read('db-pass4-columns-db02_academics_and_timetable.json'),
    read('db-pass4-columns-db09_tpo_and_recruiter_operations.json'),
    read('database-parity-db09-field-ledger.json'));
  const projects = auditDb019ProjectDecisions(
    read('db-pass4-columns-db07_projects.json'),
    read('database-parity-db07-field-reconciliation.json'));
  return {...base,projects,valid:base.valid && projects.valid,
    auditedSourceFields:base.reviewedSourceFields + projects.sourceFields,
    errors:[...base.errors,...projects.errors]};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = loadDb019SemanticDecisions();
    console.log(JSON.stringify(report,null,2));
    if (!report.valid || process.argv.includes('--require-complete')) process.exitCode = 2;
  } catch (error) { console.error(error); process.exitCode = 1; }
}
