#!/usr/bin/env node
// DB-019 non-destructive global field-census preflight.
// This verifies the 2,829-field SOURCE inventory only. It never confers
// runtime parity, retirement approval, or a release/database phase gate.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reconcileDb00 } from './db19-db00-disposition-crosscheck.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function auditDb019(index, ledgers, decisions, {db00Disposition = null, db00Approval = null} = {}) {
  const errors = [];
  const fail = (code, details = {}) => errors.push({ code, ...details });
  if (!index || !Array.isArray(index.artifacts) || !index.domainCounts ||
      !Array.isArray(ledgers) || !decisions || !Array.isArray(decisions.decisions)) {
    return { valid: false, errors: [{code: 'INVALID_INPUT'}], sourceOnly: true, acceptanceReady: false };
  }
  if (index.trackedTables !== 199 || index.sourceFields !== 2829 || index.artifacts.length !== 11)
    fail('SOURCE_INDEX_DENOMINATOR', {tables:index.trackedTables,fields:index.sourceFields,domains:index.artifacts.length});
  if (!/^[a-f0-9]{40}$/i.test(index.sourceLegacySha || '')) fail('INVALID_SOURCE_SHA');
  const seenDomains = new Set(), seenTables = new Set();
  const perDomain = [];
  let totalFields = 0, totalTables = 0, mapped = 0, sourceEvidence = 0, pending = 0;
  for (let i = 0; i < index.artifacts.length; i++) {
    const artifact = index.artifacts[i], ledger = ledgers[i];
    if (!artifact || typeof artifact.domain !== 'string' || seenDomains.has(artifact.domain)) {
      fail('DUPLICATE_OR_INVALID_DOMAIN', {domain: artifact?.domain}); continue;
    }
    seenDomains.add(artifact.domain);
    if (!ledger || ledger.domain !== artifact.domain || ledger.sourceSha !== index.sourceLegacySha ||
        !Array.isArray(ledger.tables)) {
      fail('LEDGER_SOURCE_OR_DOMAIN_MISMATCH', {domain: artifact.domain}); continue;
    }
    const domainTables = ledger.tables.length;
    let fields = 0, dm = 0, de = 0;
    for (const table of ledger.tables) {
      if (typeof table.table !== 'string' || seenTables.has(table.table) || !Array.isArray(table.rows)) {
        fail('DUPLICATE_OR_INVALID_TABLE', {domain: artifact.domain, table: table.table}); continue;
      }
      seenTables.add(table.table);
      if (table.sourceFieldCount !== table.rows.length) fail('TABLE_FIELD_COUNT', {table: table.table});
      const columns = new Set();
      for (const row of table.rows) {
        const column = row?.legacyColumn;
        if (!column || row.legacyTable !== table.table || columns.has(column))
          fail('DUPLICATE_OR_INVALID_FIELD', {table: table.table, column});
        columns.add(column);
        fields++;
        if (row.verifiedMapping) dm++;
        if (row.validationEvidence) de++;
      }
    }
    const expected = index.domainCounts[artifact.domain];
    if (!expected || fields !== expected.fields || fields !== artifact.fields || domainTables !== expected.tables)
      fail('DOMAIN_DENOMINATOR_MISMATCH', {domain: artifact.domain, fields, domainTables, expected});
    if (ledger.counts?.fields !== fields || ledger.counts?.tables !== domainTables)
      fail('LEDGER_SELF_COUNT_MISMATCH', {domain: artifact.domain});
    totalFields += fields; totalTables += domainTables; mapped += dm; sourceEvidence += de;
    pending += fields - de;
    perDomain.push({domain: artifact.domain, tables: domainTables, fields, mapped: dm, evidenceRows: de, pendingSourceEvidence: fields-de});
  }
  if (totalFields !== index.sourceFields || totalTables !== index.trackedTables)
    fail('GLOBAL_DENOMINATOR_MISMATCH', {totalTables,totalFields});
  if (Object.keys(index.domainCounts).length !== seenDomains.size)
    fail('MISSING_SOURCE_DOMAIN');
  // DB00's separate, user-approved domain ledger has 732 per-table dispositions.
  // Those are legitimate greenfield scope decisions, NOT verified runtime mappings.
  // Without the independently checked overlay, never claim these fields closed.
  const db00Ledger = ledgers.find(ledger => ledger?.domain === 'DB00_HISTORICAL_AND_ENGINE');
  const db00 = db00Disposition === null ? null : reconcileDb00(db00Ledger, db00Disposition, db00Approval);
  if (db00 && !db00.valid) for (const detail of db00.errors)
    fail('DB00_DISPOSITION_' + detail.code, {detail});
  const db00Closed = db00?.valid ? db00.summary.sourceDispositionClosedFields : null;
  if (db00?.valid && db00.summary.fields !== index.domainCounts.DB00_HISTORICAL_AND_ENGINE?.fields)
    fail('DB00_DISPOSITION_SOURCE_INDEX_DRIFT');
  const decisionOpen = decisions.decisions.filter(x =>
    !x || x.approvedRetirement !== true && !String(x.status).startsWith('ACCEPTED')).length;
  const verifiedDecisionFields = decisions.decisions.reduce((sum, x) => sum + (Number(x?.verifiedFields)||0),0);
  return {
    valid: errors.length === 0, errors,
    sourceOnly: true, acceptanceReady: false,
    sourceSha: index.sourceLegacySha,
    census: {tables:totalTables, fields:totalFields, domains:perDomain.length},
    progress: {verifiedMappingRows:mapped,sourceEvidenceRows:sourceEvidence,
      awaitingSourceEvidence:pending, sourceEvidenceComplete:sourceEvidence === totalFields,
      unresolvedReviewDecisions:decisionOpen, reviewDecisionVerifiedFields:verifiedDecisionFields,
      db00SourceDecisionCoverage: db00Closed === null ? null : {
        totalFields: db00.summary.fields,
        sourceDispositionClosedFields: db00Closed,
        greenfieldBackupExcludedFields: db00.summary.retiredBackupFields,
        platformMetadataReplacedFields: db00.summary.replacedMetadataFields,
        userApprovedProductScopeExcludedFields: db00.summary.approvedProductFields,
        productDecisionPendingFields: db00.summary.pendingProductFields,
        runtimeMappingsVerifiedByThisOverlay: 0,
        remainingGlobalFieldsNotDisposedByDb00: totalFields - db00Closed,
      }},
    domains:perDomain,
    db00DispositionOverlay: db00,
    remainingAcceptanceGates:[
      'Per-field active, redesigned, external and retired semantic decisions with producer/consumer evidence',
      'Current registered PostgreSQL catalog and source-to-target graph comparison',
      'Tenant, permission, privacy, lifecycle and race negative witnesses on exact release SHA',
      'Independent retirement review and final DB020 phase-gate approval'
    ]
  };
}

export function loadDb019(rootDir = root) {
  const read = rel => JSON.parse(fs.readFileSync(path.resolve(rootDir, rel), 'utf8'));
  const index = read('docs/planning/database-parity-pass4-column-index.json');
  const ledgers = index.artifacts.map(({path: ledgerPath}) => read(ledgerPath));
  const decisions = read('docs/planning/database-parity-pass4-review-decisions.json');
  const db00Disposition = read('docs/planning/db00-historical-engine-disposition.json');
  const db00Approval = read('docs/planning/db003-smrithi-vnext-scope-decision.json');
  return auditDb019(index, ledgers, decisions, {db00Disposition,db00Approval});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = loadDb019();
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (!report.valid || (process.argv.includes('--require-complete') && !report.acceptanceReady))
    process.exitCode = 1;
}
