import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const plan = read("docs/planning/db019-p28-tracker-field-review.json");
const source = read("docs/planning/db-pass4-columns-db10_shared_operations.json");
const original = read("docs/planning/database-parity-db10-field-ledger.json");
const tracker = read("docs/tracker.json");
const sourceTableNames = [
  "bug_report", "bug_report_activity", "bug_report_attachment",
  "bug_tracker_access", "bug_tracker_session",
];

test("P28 exact 58 identity census is complete, unique and pinned to source", () => {
  assert.equal(plan.id, "DB19-P28");
  assert.equal(plan.sourceSha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
  assert.equal(plan.sourceSha, source.sourceSha);
  assert.equal(plan.sourceFieldCount, 58);
  assert.deepEqual(plan.sourceTables, sourceTableNames);
  assert.equal(plan.fields.length, 58);

  const originalRows = original.records.filter(record => sourceTableNames.includes(record.legacyTable));
  assert.equal(originalRows.length, 58);
  const sourceRows = source.tables.filter(table => sourceTableNames.includes(table.table))
    .flatMap(table => table.rows);
  assert.equal(sourceRows.length, 58);
  const identity = row => `${row.sourceTable ?? row.legacyTable}.${row.sourceColumn ?? row.legacyColumn}`;
  const expected = new Set(sourceRows.map(identity));
  const actual = new Set(plan.fields.map(identity));
  assert.equal(actual.size, 58, "No duplicate legacy source column identities");
  assert.deepEqual(actual, expected, "No omitted, invented or misassigned P28 source fields");
  assert.deepEqual(actual, new Set(originalRows.map(identity)), "Original DB10 field ledger must match");

  for (const field of plan.fields) {
    const sourceRow = sourceRows.find(row => identity(row) === identity(field));
    assert.ok(sourceRow);
    assert.equal(field.sourceDefinition, sourceRow.sourceDefinition);
    assert.ok(typeof field.targetCandidate === "string" && field.targetCandidate.length > 0);
    assert.ok(typeof field.semanticRisk === "string" && field.semanticRisk.length > 0);
    assert.equal(field.sourceVerifiedAtSha, plan.sourceSha);
    assert.ok(Array.isArray(field.exactRuntimeProducerCandidates));
    assert.ok(Array.isArray(field.exactRuntimeConsumerCandidates));
    for (const file of [
      ...field.exactRuntimeProducerCandidates,
      ...field.exactRuntimeConsumerCandidates,
    ]) {
      assert.ok(fs.existsSync(path.join(root, file)), `Missing runtime file: ${file}`);
    }
  }
});

test("P28 refuses artificial runtime proof, retirement and premature package closure", () => {
  assert.equal(plan.runtimeVerifiedCount, 0);
  assert.equal(plan.fieldDispositionApproval, "PENDING");
  assert.match(plan.recordType, /NOT_ACCEPTED/);
  for (const field of plan.fields) {
    assert.equal(field.approvedFinalDisposition, false);
    assert.equal(field.retirementApproved, false);
    assert.equal(field.runtimeVerified, false);
    assert.equal(field.producerVerified, false);
    assert.equal(field.consumerVerified, false);
  }
  const parent = tracker.tasks.find(task => task.id === "DB-019");
  const pkg = parent?.workPlan?.packages.find(row => row.id === "DB19-P28");
  assert.ok(pkg);
  assert.equal(pkg.sourceFieldCount, 58);
  assert.equal(pkg.done, false);
  assert.equal(parent.done, false);
});

test("P28 calls out disabled legacy bearer sessions and private object receipts", () => {
  const fields = new Map(plan.fields.map(f => [`${f.sourceTable}.${f.sourceColumn}`, f]));
  const sessions = plan.fields.filter(f => f.sourceTable === "bug_tracker_session");
  assert.equal(sessions.length, 5);
  for (const item of sessions) {
    assert.equal(item.disposition, "UNRESOLVED_LEGACY_BEARER_SESSION_RETIREMENT");
    assert.deepEqual(item.exactRuntimeProducerCandidates, []);
    assert.deepEqual(item.exactRuntimeConsumerCandidates, []);
    assert.equal(item.retirementApproved, false);
  }
  assert.match(fields.get("bug_report_attachment.storage_key")?.semanticRisk ?? "", /private object key/i);
  assert.match(fields.get("bug_report_attachment.size_bytes")?.semanticRisk ?? "", /physical HEAD/i);
  assert.match(fields.get("bug_report.source_url")?.semanticRisk ?? "", /query/i);
  assert.match(fields.get("bug_report.root_cause")?.semanticRisk ?? "", /private/i);
  assert.match(fields.get("bug_tracker_access.active")?.semanticRisk ?? "", /revocation/i);
});
