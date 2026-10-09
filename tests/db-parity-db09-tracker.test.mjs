import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const json = relative =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

const source = json(
  "docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json",
);
const tracker = json(
  "docs/planning/database-parity-db09-parallel-tracker.json",
);

test("DB09 source candidates are exhaustively retained without silent field drops", () => {
  assert.equal(source.domain, "DB09_TPO_AND_RECRUITER_OPERATIONS");
  assert.equal(source.tables.length, 31);
  assert.equal(source.counts.tables, 31);
  assert.equal(source.counts.fields, 279);
  assert.equal(tracker.counts.legacyTableCandidates, source.counts.tables);
  assert.equal(tracker.counts.legacyFieldCandidates, source.counts.fields);
  assert.equal(tracker.originalLegacyOracleSha, source.sourceSha);
  assert.equal(tracker.tables.length, source.tables.length);
  const seen = new Set();

  for (const original of source.tables) {
    const row = tracker.tables.find(t => t.legacyTableCandidate === original.table);
    assert.ok(row, `missing source table ${original.table}`);
    assert.equal(row.sourceFieldCount, original.rows.length);
    assert.equal(row.fields.length, original.rows.length);
    assert.equal(row.candidateMappingIsVerified, false);
    for (const f of original.rows) {
      const key = `${original.table}.${f.legacyColumn}`;
      assert.ok(!seen.has(key), `duplicate source field ${key}`);
      seen.add(key);
      const match = row.fields.find(x => x.legacyField === f.legacyColumn);
      assert.ok(match, `untracked source field ${key}`);
      assert.equal(match.sourceSqlType, f.sourceType ?? null);
      assert.equal(match.sourceSqlDefinition, f.sourceDefinition ?? null);
      assert.deepEqual(match.sourceRiskFlags, f.riskFlags ?? []);
      assert.equal(match.disposition, "UNVERIFIED_FIELD_SEMANTICS");
      assert.equal(match.verifiedVnextMapping, null);
      assert.equal(match.validationEvidence, null);
    }
  }
  assert.equal(seen.size, 279);
});

test("DB09 keeps cross-workstream boundaries explicit", () => {
  const byTable = Object.fromEntries(
    tracker.tables.map(t => [t.legacyTableCandidate, t]),
  );
  for (const table of ["student_request", "job_round"]) {
    assert.equal(byTable[table].responsibleWorkstream, "DB08_OWNED");
  }
  for (const table of ["email_suppression", "notification_outbox"]) {
    assert.equal(byTable[table].responsibleWorkstream, "DB10_DEPENDENCY");
  }
  assert.equal(tracker.counts.fieldMappingsVerified, 0);
  assert.equal(tracker.counts.fieldMappingsDbTested, 0);
  assert.equal(tracker.counts.runtimeTestsExecuted, 0);
});

test("DB09 name matches remain candidates, never automatically verified", () => {
  assert.ok(tracker.tables.every(t =>
    Array.isArray(t.candidateTargets) &&
    t.status === "FIELD_SEMANTICS_UNVERIFIED" &&
    t.activeRetiredHistoricalDecision ===
      "PENDING_MIGRATION_CHAIN_AND_PRODUCER_REVIEW",
  ));
  assert.ok(tracker.tables.some(t => t.candidateTargets.length > 0));
  assert.ok(tracker.tables.some(t => t.candidateTargets.length === 0));
});
