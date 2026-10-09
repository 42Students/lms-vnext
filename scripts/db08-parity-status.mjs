#!/usr/bin/env node
// DB08 source-ledger integrity check. This checks *tracking completeness*, never DB parity.
// Usage: node scripts/db08-parity-status.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "docs/planning/db-pass4-columns-db08_placement_policy_and_outcomes.json");
const ledgerPath = join(root, "docs/planning/database-parity-db08-field-ledger.json");

const allowedStatuses = new Set([
  "UNVERIFIED", "MAPPED", "IMPLEMENTED", "DB_TESTED",
  "WORKFLOW_VERIFIED", "REDESIGNED", "RETIRED", "BLOCKED",
]);
const evidenceRequired = new Set(["DB_TESTED", "WORKFLOW_VERIFIED"]);
const mappingRequired = new Set(["MAPPED", "IMPLEMENTED", "DB_TESTED", "WORKFLOW_VERIFIED"]);

const key = (table, field) => `${table}.${field}`;

export function validateDB08Ledger(source, ledger) {
  assert.equal(ledger.domain, "DB08_PLACEMENT_POLICY_AND_OUTCOMES");
  assert.equal(source.domain, ledger.domain);
  assert.equal(ledger.capturedFrom.legacyBackendSha, source.sourceSha);
  assert.equal(ledger.tables.length, source.tables.length, "source table was lost");

  const originals = new Map();
  for (const table of source.tables) {
    assert(!originals.has(table.table), `duplicate legacy table ${table.table}`);
    const fields = new Set();
    for (const row of table.rows) {
      const k = key(table.table, row.legacyColumn);
      assert(!fields.has(k), `duplicate source field ${k}`);
      fields.add(k);
      originals.set(k, row);
    }
  }

  const seenTables = new Set();
  const seenFields = new Set();
  const counts = Object.fromEntries([...allowedStatuses].map(s => [s, 0]));
  const perPriority = {};
  for (const table of ledger.tables) {
    assert(!seenTables.has(table.legacyTable), `duplicate ledger table ${table.legacyTable}`);
    seenTables.add(table.legacyTable);
    assert(source.tables.some(t => t.table === table.legacyTable), `unknown legacy table ${table.legacyTable}`);
    assert.equal(table.fields.length, table.fieldCount, `field count metadata changed for ${table.legacyTable}`);
    for (const row of table.fields) {
      const k = key(table.legacyTable, row.legacyColumn);
      assert(originals.has(k), `unexpected field ${k}`);
      assert(!seenFields.has(k), `duplicate ledger field ${k}`);
      seenFields.add(k);
      assert(allowedStatuses.has(row.status), `unknown status for ${k}: ${row.status}`);
      if (mappingRequired.has(row.status)) {
        assert(row.verifiedMapping && typeof row.verifiedMapping === "object",
          `${k} cannot be ${row.status} without verified mapping`);
        assert(row.producerConsumerEvidence, `${k} missing workflow/semantic evidence`);
      }
      if (evidenceRequired.has(row.status)) {
        assert(row.dbTestEvidence, `${k} cannot be ${row.status} without DB evidence`);
      }
      if (row.status === "REDESIGNED" || row.status === "RETIRED") {
        assert(row.reviewDecision && row.reviewDecision.approvedBy && row.reviewDecision.rationale,
          `${k} cannot be ${row.status} without explicit approved decision`);
      }
      counts[row.status]++;
      const p = table.priority ?? "UNASSIGNED";
      perPriority[p] = (perPriority[p] ?? 0) + 1;
    }
  }
  for (const field of originals.keys()) {
    assert(seenFields.has(field), `unmapped legacy candidate disappeared: ${field}`);
  }
  assert.equal(ledger.counts.legacyTables, source.tables.length);
  assert.equal(ledger.counts.legacyFields, originals.size);
  assert.equal(ledger.counts.verifiedFields,
    counts.WORKFLOW_VERIFIED + counts.REDESIGNED + counts.RETIRED,
    "verified counter disagrees with evidence ledger");
  assert.equal(ledger.gate.fieldsUnverified, counts.UNVERIFIED,
    "unverified counter disagrees with evidence ledger");

  const missingCandidates = ledger.tables
    .filter(t => t.candidateVnextTables.length === 0)
    .map(t => t.legacyTable);
  assert.equal(ledger.counts.candidateDirectTableMissing, missingCandidates.length);

  return {
    tables: seenTables.size,
    sourceFieldCandidates: seenFields.size,
    statusCounts: counts,
    prioritizedFields: perPriority,
    candidateMissingTables: missingCandidates,
    sourceOnly: true,
    readyForParityCertification: counts.UNVERIFIED === 0 &&
      counts.MAPPED === 0 && counts.IMPLEMENTED === 0 && counts.BLOCKED === 0 &&
      counts.DB_TESTED === 0 && ledger.gate.disposablePostgresReplay === "PASSED" &&
      ledger.gate.liveLegacySchema === "INSPECTED",
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const result = validateDB08Ledger(source, ledger);
  console.log(JSON.stringify(result, null, 2));
  if (!result.readyForParityCertification) {
    console.log("DB08 NOT VERIFIED: this report checks field-ledger completeness, not parity.");
  }
}
