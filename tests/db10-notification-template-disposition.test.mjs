import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const disposition = JSON.parse(readFileSync(
  "docs/planning/database-parity-db10-notification-template-disposition.json",
  "utf8",
));
const contract = readFileSync(
  "docs/planning/database-parity-db10-notification-template-contract.md",
  "utf8",
);

test("DB37 covers both duplicate legacy template families exactly", () => {
  assert.equal(disposition.records.length, 56);
  const byTable = new Map();
  for (const row of disposition.records) {
    const bucket = byTable.get(row.legacyTable) ?? [];
    bucket.push(row);
    byTable.set(row.legacyTable, bucket);
  }
  assert.equal(byTable.get("notification_template")?.length, 28);
  assert.equal(byTable.get("lms_notification_template")?.length, 28);
  const a = [...new Set(byTable.get("notification_template").map(r => r.legacyColumn))].sort();
  const b = [...new Set(byTable.get("lms_notification_template").map(r => r.legacyColumn))].sort();
  assert.equal(a.length, 28);
  assert.deepEqual(a, b);
});

test("DB37 assigns one explicit source disposition to every field", () => {
  for (const row of disposition.records) {
    assert.ok(row.disposition);
    assert.ok(row.rationale);
    assert.ok(Array.isArray(row.runtimeEvidence) && row.runtimeEvidence.length >= 3);
    assert.equal(row.exactRuntimeVerified, false);
    assert.equal(row.finalRetirementApproved, false);
  }
  assert.match(disposition.status, /RETIREMENT_PENDING_GLOBAL_NATIVE_LIVE_PROOF/);
});

test("DB37 does not invent a persisted runtime template registry", () => {
  assert.match(disposition.currentRuntimeDecision, /Do not create a generic vNext notification-template table/);
  assert.equal(
    disposition.records.filter(r =>
      r.disposition === "SOURCE_RETIRED_PERSISTENCE_METADATA_PENDING_GLOBAL_PROOF"
    ).length,
    20,
  );
  assert.match(contract, /No DB or CSV/);
  assert.match(contract, /Creating two replacement tables would therefore duplicate/);
});

test("DB37 routes event/channel identity to typed code", () => {
  for (const column of [
    "template_key", "notification_type", "channel", "action_url", "icon",
  ]) {
    const rows = disposition.records.filter(r => r.legacyColumn === column);
    assert.equal(rows.length, 2);
    assert.ok(rows.every(r => r.disposition === "REDESIGNED_TO_TYPED_CODE_REGISTRY"));
  }
});

test("DB37 keeps email provider IDs and SMS DLT concepts in configuration", () => {
  const external = disposition.records.filter(r => r.legacyColumn === "external_template_id");
  assert.equal(external.length, 2);
  assert.ok(external.every(r =>
    r.disposition === "REDESIGNED_TO_PROVIDER_CONFIGURATION"
  ));
  for (const column of [
    "dlt_entity_id", "dlt_template_id", "is_dlt_compliant", "sms_variable_format",
  ]) {
    const rows = disposition.records.filter(r => r.legacyColumn === column);
    assert.equal(rows.length, 2);
    assert.ok(rows.every(r =>
      r.disposition === "REDESIGNED_TO_SMS_DLT_CONFIGURATION"
    ));
  }
});

test("DB37 keeps content channel-specific and validation metadata in code", () => {
  for (const column of ["subject", "body", "html_body", "language"]) {
    assert.ok(disposition.records
      .filter(r => r.legacyColumn === column)
      .every(r => r.disposition === "REDESIGNED_CHANNEL_SPECIFIC"));
  }
  for (const column of [
    "variable_schema", "merge_variable_mapping", "example_data", "description",
  ]) {
    assert.ok(disposition.records
      .filter(r => r.legacyColumn === column)
      .every(r => r.disposition === "REDESIGNED_TO_CODE_SCHEMA_OR_DOCUMENTATION"));
  }
});

test("DB37 global proof gates remain explicit", () => {
  assert.equal(disposition.globalProofStillRequired.length, 3);
  assert.match(contract, /DB00 native-SQL\/detached-consumer sweep/);
  assert.match(contract, /DB19 final freeze approves/);
  assert.match(contract, /cannot be DONE_VERIFIED/);
});

test("DB37 enumerates all 18 acceptance requirements as not run", () => {
  for (let i = 1; i <= 18; i += 1) {
    const id = "DB37-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing acceptance requirement " + id);
  }
  assert.match(contract, /Acceptance requirements — NOT RUN/);
});

test("DB37 never treats a source-mapped template field as runtime verified", () => {
  assert.equal(disposition.counts.vnextWorkflowVerifiedFields, 0);
  assert.equal(disposition.counts.formallyApprovedRetiredFields, 0);
  for (const row of disposition.records) {
    const expected = row.disposition.startsWith("SOURCE_RETIRED")
      ? "NOT_APPLICABLE_SOURCE_RETIREMENT_PENDING"
      : "SOURCE_DESIGN_ONLY_VNEXT_PRODUCER_CONSUMER_NOT_PROVEN";
    assert.equal(row.targetImplementationStatus, expected, row.legacyId);
  }
  assert.equal(disposition.targetEvidenceBoundary.targetParity,
    "NOT_VNEXT_RUNTIME_VERIFIED");
});

test("DB37 preserves identical source states in the 221-field DB10 ledger", () => {
  const db10 = JSON.parse(readFileSync(
    "docs/planning/database-parity-db10-field-ledger.json", "utf8",
  ));
  const lookup = new Map(db10.records.map(row => [
    row.legacyTable + "." + row.legacyColumn, row,
  ]));
  assert.equal(db10.counts.notificationTemplateSourceDispositioned, 56);
  assert.equal(db10.counts.notificationTemplateVnextRuntimeVerified, 0);
  assert.equal(db10.counts.notificationTemplateSourceTargetsNotRuntimeProven, 36);
  assert.equal(db10.counts.notificationTemplateSourceRetirementCandidates, 20);
  for (const expected of disposition.records) {
    const row = lookup.get(expected.legacyTable + "." + expected.legacyColumn);
    assert.ok(row, expected.legacyId);
    assert.equal(row.sourceDisposition, expected.disposition);
    assert.equal(row.targetImplementationStatus, expected.targetImplementationStatus);
    assert.equal(row.status, "UNMAPPED");
    assert.equal(row.verifiedLegacySha, null);
  }
});
