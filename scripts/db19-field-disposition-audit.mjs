#!/usr/bin/env node
// DB-019 source-level field ledger audit. NEVER certifies database runtime parity.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reconcileDb00 } from './db19-db00-disposition-crosscheck.mjs';
import { reconcileDb01Triage, reconcileDb01ProposalCoverage, gitBlobSha } from './db19-db01-triage-crosscheck.mjs';

export const DOMAIN_SUFFIXES = Object.freeze([
  'db00_historical_and_engine', 'db01_identity_and_tenancy',
  'db02_academics_and_timetable', 'db03_groups_and_electives',
  'db04_profiles_and_verification', 'db05_courses_and_content',
  'db06_assessments_and_attendance', 'db07_projects',
  'db08_placement_policy_and_outcomes', 'db09_tpo_and_recruiter_operations',
  'db10_shared_operations',
]);
export const HISTORICAL_FLOOR = Object.freeze({ tables: 199, fields: 2829 });
const LEDGER_PREFIX = 'docs/planning/db-pass4-columns-';
const missing = value => typeof value !== 'string' || value.trim() === '';

export function auditLedgers(inputs, { requireAllDomains = true, enforceFloor = true,
  db00Disposition = null, db00Approval = null, db01Triage = null, db01InventoryBlobSha = null,
  db01Auth78 = null, db01Remaining150 = null, db01QueueBlobSha = null } = {}) {
  const errors = [];
  const tableOwners = new Map();
  const fieldOwners = new Map();
  const domainNames = new Set();
  const statusCounts = {};
  const perDomain = [];
  let totalTables = 0, totalFields = 0, proposedMappings = 0;
  let runtimeMappings = 0, sourceReviewed = 0, historicRetirementPending = 0;
  let noSourceEvidence = 0;
  const sourceShas = new Set();

  if (!Array.isArray(inputs)) throw new TypeError('inputs must be an array of ledger entries');
  const paths = new Set();
  for (const entry of inputs) {
    const filename = entry?.path;
    const ledger = entry?.ledger;
    if (missing(filename) || !ledger || typeof ledger !== 'object') {
      errors.push({ code: 'INVALID_LEDGER_ENTRY', path: filename ?? null });
      continue;
    }
    if (paths.has(filename)) errors.push({ code: 'DUPLICATE_LEDGER_PATH', path: filename });
    paths.add(filename);
    if (missing(ledger.domain)) {
      errors.push({ code: 'MISSING_DOMAIN', path: filename });
      continue;
    }
    if (domainNames.has(ledger.domain)) errors.push({ code: 'DUPLICATE_DOMAIN', domain: ledger.domain });
    domainNames.add(ledger.domain);
    if (requireAllDomains) {
      const expected = filename.replace(LEDGER_PREFIX, '').replace(/\.json$/, '').toUpperCase();
      if (ledger.domain !== expected) errors.push({ code: 'DOMAIN_FILENAME_MISMATCH', path: filename, domain: ledger.domain, expected });
      if (!/^[a-f0-9]{40}$/i.test(ledger.sourceSha || ''))
        errors.push({ code: 'INVALID_SOURCE_ORACLE_SHA', path: filename, sourceSha: ledger.sourceSha ?? null });
      else sourceShas.add(ledger.sourceSha);
    }
    if (!Array.isArray(ledger.tables)) {
      errors.push({ code: 'MISSING_TABLE_LIST', path: filename });
      continue;
    }
    const record = { domain: ledger.domain, tables: ledger.tables.length, fields: 0,
      sourceReviewed: 0, proposedMappings: 0, runtimeMappings: 0,
      retirementCandidatesPending: 0, reviewStatuses: {} };
    totalTables += ledger.tables.length;
    for (const table of ledger.tables) {
      const tableName = table?.table;
      if (missing(tableName) || !Array.isArray(table?.rows)) {
        errors.push({ code: 'INVALID_TABLE', domain: ledger.domain, table: tableName ?? null });
        continue;
      }
      if (tableOwners.has(tableName)) errors.push({ code: 'DUPLICATE_TABLE_OWNER', table: tableName,
        first: tableOwners.get(tableName), second: ledger.domain });
      else tableOwners.set(tableName, ledger.domain);
      if (table.sourceFieldCount !== table.rows.length) errors.push({ code: 'TABLE_FIELD_COUNT_MISMATCH',
        table: tableName, declared: table.sourceFieldCount, actual: table.rows.length });
      record.fields += table.rows.length;
      totalFields += table.rows.length;
      for (const row of table.rows) {
        const key = (row?.legacyTable ?? '') + '.' + (row?.legacyColumn ?? '');
        if (row?.legacyTable !== tableName || missing(row?.legacyColumn) || missing(row?.sourceType)) {
          errors.push({ code: 'INVALID_FIELD_IDENTITY', table: tableName, key });
          continue;
        }
        if (fieldOwners.has(key)) errors.push({ code: 'DUPLICATE_FIELD_OWNER', key,
          first: fieldOwners.get(key), second: ledger.domain });
        else fieldOwners.set(key, ledger.domain);
        const status = row.reviewStatus || 'UNCLASSIFIED';
        record.reviewStatuses[status] = (record.reviewStatuses[status] || 0) + 1;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        if (status.startsWith('SOURCE_REVIEWED_')) { record.sourceReviewed++; sourceReviewed++; }
        if (row.proposedVnextTargets?.length || row.proposedSemanticMapping) {
          record.proposedMappings++; proposedMappings++;
        }
        if (status === 'CLASSIFY_HISTORIC_RETIREMENT') {
          record.retirementCandidatesPending++; historicRetirementPending++;
        }
        if (!row.sourceEvidence) { noSourceEvidence++;
          errors.push({ code: 'FIELD_WITHOUT_SOURCE_EVIDENCE', key });
        }
        if (row.verifiedMapping !== null && row.verifiedMapping !== undefined) {
          // Self-declared execution envelopes are not independently verifiable.
          // A source ledger can forge a SHA, command, version and PASS result.
          // Keep verifiedMapping fail-closed until independent run attestation
          // is checked outside this source-inventory integrity scanner.
          const hasProof = false;
          if (missing(row.verifiedMapping) || !hasProof || !row.validationEvidence ||
              /source[- ]only|not (?:runtime|postgres)|pending/i.test(row.validationEvidence))
            errors.push({ code: 'UNSUPPORTED_VERIFIED_MAPPING', key });
          else { record.runtimeMappings++; runtimeMappings++; }
        }
        if (/(?:DONE_VERIFIED|WORKFLOW_VERIFIED|DB_TESTED)/.test(status) &&
            (row.verifiedMapping == null || !row.validationEvidence))
          errors.push({ code: 'VERIFIED_STATUS_WITHOUT_EVIDENCE', key, status });
      }
    }
    if (ledger.counts?.tables !== record.tables || ledger.counts?.fields !== record.fields)
      errors.push({ code: 'LEDGER_COUNTS_MISMATCH', domain: ledger.domain,
        declared: ledger.counts, actual: { tables: record.tables, fields: record.fields } });
    perDomain.push(record);
  }
  if (requireAllDomains) for (const suffix of DOMAIN_SUFFIXES) {
    const filename = LEDGER_PREFIX + suffix + '.json';
    if (!paths.has(filename)) errors.push({ code: 'MISSING_DOMAIN_LEDGER', path: filename });
  }
  if (requireAllDomains && sourceShas.size > 1)
    errors.push({ code: 'MIXED_LEGACY_ORACLE_SHAS', sourceShas: [...sourceShas].sort() });
  if (enforceFloor && (totalTables < HISTORICAL_FLOOR.tables || totalFields < HISTORICAL_FLOOR.fields))
    errors.push({ code: 'HISTORICAL_INVENTORY_REGRESSION', floor: HISTORICAL_FLOOR,
      actual: { tables: totalTables, fields: totalFields } });
  // Source-owned DB00 decisions are a separate overlay, NOT an inferred
  // upgrade of 631 raw backup rows to runtime-verified field mappings.
  const db00Review = db00Disposition === null ? null : reconcileDb00(
    inputs.find(entry => entry?.ledger?.domain === 'DB00_HISTORICAL_AND_ENGINE')?.ledger,
    db00Disposition, db00Approval,
  );
  if (db00Review && !db00Review.valid) for (const detail of db00Review.errors)
    errors.push({ code: 'DB00_DISPOSITION_' + detail.code, detail });
  if (db00Review?.valid && historicRetirementPending !== db00Review.summary.retiredBackupFields)
    errors.push({ code: 'DB00_RETIREMENT_STATUS_OVERLAY_DRIFT',
      rawBackupCandidateRows: historicRetirementPending,
      sourceApprovedBackupFields: db00Review.summary.retiredBackupFields });
  // DB01 owns an exact 312-field source activity triage in a separate
  // immutably pinned file. Do not rewrite its raw ledger or conflate
  // current-source activeness with approved runtime schema mappings.
  const db01Review = db01Triage === null ? null : reconcileDb01Triage(
    inputs.find(entry => entry?.ledger?.domain === 'DB01_IDENTITY_AND_TENANCY')?.ledger,
    db01Triage, {inventoryBlobSha:db01InventoryBlobSha},
  );
  if (db01Review && !db01Review.valid)
    for (const detail of db01Review.errors)
      errors.push({code:'DB01_SOURCE_TRIAGE_' + detail.code,detail});
  const db01Proposals = db01Triage === null || db01Auth78 === null ||
    db01Remaining150 === null ? null : reconcileDb01ProposalCoverage(
      db01Triage, db01Auth78, db01Remaining150,
      {authNoTargetQueueBlobSha:db01QueueBlobSha},
    );
  if (db01Proposals && !db01Proposals.valid)
    for (const detail of db01Proposals.errors)
      errors.push({code:'DB01_PROPOSAL_' + detail.code,detail});

  return {
    verification: 'SOURCE_LEDGER_INTEGRITY_ONLY_NOT_POSTGRES_ACCEPTANCE',
    sourceInventoryIntegrity: errors.length === 0 ? 'PASS' : 'FAIL',
    databaseParityVerified: false,
    counts: { domains: perDomain.length, tables: totalTables, fields: totalFields,
      uniqueTables: tableOwners.size, uniqueFields: fieldOwners.size,
      sourceReviewed, proposedMappings, runtimeMappings, historicRetirementPending,
      rowsMissingSourceEvidence: noSourceEvidence, legacyOracleShas: [...sourceShas].sort(),
      backupFieldsSourceDisposed: db00Review?.valid ? db00Review.summary.retiredBackupFields : null,
      migrationMetadataFieldsSourceDisposed: db00Review?.valid ? db00Review.summary.replacedMetadataFields : null,
      smrithiFieldsPendingProductDecision: db00Review?.valid ? db00Review.summary.pendingProductFields : null,
      smrithiFieldsExcludedByUserDecision: db00Review?.valid ? db00Review.summary.approvedProductFields : null,
      db01SourceActivenessReviewed: db01Review?.valid ? db01Review.summary.reviewedFields : null,
      db01SourceActiveFields: db01Review?.valid ? db01Review.summary.sourceActiveFields : null,
      db01TargetCandidatesUnverified: db01Review?.valid ? db01Review.summary.targetCandidatesUnverified : null,
      db01CrosswalkUnionTargetCandidates: db01Proposals?.valid ? db01Proposals.summary.unionTargetCandidates : null,
      db01CrosswalkFieldsWithoutCandidate: db01Proposals?.valid ? db01Proposals.summary.withoutTargetCandidate : null },
    statusCounts, perDomain, db00DispositionOverlay: db00Review,
    db01SourceTriageOverlay: db01Review, db01ProposalCoverageOverlay: db01Proposals, errors,
  };
}

export function auditCheckout(root) {
  const inputs = DOMAIN_SUFFIXES.map(suffix => {
    const filename = LEDGER_PREFIX + suffix + '.json';
    const full = path.join(root, filename);
    if (!fs.existsSync(full)) return { path: filename, ledger: null };
    return { path: filename, ledger: JSON.parse(fs.readFileSync(full, 'utf8')) };
  });
  const decisionPath = path.join(root, 'docs/planning/db00-historical-engine-disposition.json');
  const db00Disposition = fs.existsSync(decisionPath)
    ? JSON.parse(fs.readFileSync(decisionPath, 'utf8')) : null;
  const approvalPath=path.join(root,'docs/planning/db003-smrithi-vnext-scope-decision.json');
  const db00Approval=fs.existsSync(approvalPath)
    ? JSON.parse(fs.readFileSync(approvalPath,'utf8')):null;
  // Mandatory overlays fail closed, but report structural errors instead
  // of throwing, so an empty/incomplete checkout still yields diagnostics.
  const requiredDb01Paths = [
    'docs/planning/db01-chat02-312-field-source-triage.json',
    'docs/planning/db01-chat02-auth-78-field-proposal-crosswalk.json',
    'docs/planning/db01-chat02-remaining-150-review-queue.json',
    'docs/planning/db01-chat02-no-target-disposition-queue.json',
  ];
  const missingDb01Paths=requiredDb01Paths.filter(rel=>!fs.existsSync(path.join(root,rel)));
  const optionalDb01Json=rel=>fs.existsSync(path.join(root,rel))
    ? JSON.parse(fs.readFileSync(path.join(root,rel),'utf8')):null;
  const db01Triage=optionalDb01Json(requiredDb01Paths[0]);
  const db01Auth78=optionalDb01Json(requiredDb01Paths[1]);
  const db01Remaining150=optionalDb01Json(requiredDb01Paths[2]);
  const noTargetPath=path.join(root,requiredDb01Paths[3]);
  const db01QueueBlobSha=fs.existsSync(noTargetPath)
    ? gitBlobSha(fs.readFileSync(noTargetPath)):null;
  const db01LedgerPath=path.join(root,'docs/planning/db-pass4-columns-db01_identity_and_tenancy.json');
  const db01InventoryBlobSha=fs.existsSync(db01LedgerPath)
    ? gitBlobSha(fs.readFileSync(db01LedgerPath)):null;
  const report=auditLedgers(inputs,{db00Disposition,db00Approval,db01Triage,db01InventoryBlobSha,
    db01Auth78,db01Remaining150,db01QueueBlobSha});
  for(const missingPath of missingDb01Paths)
    report.errors.push({code:'MISSING_MANDATORY_DB01_SOURCE_FILE',path:missingPath});
  if(missingDb01Paths.length)report.sourceInventoryIntegrity='FAIL';
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const report = auditCheckout(root);
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exitCode = 2;
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  }
}
