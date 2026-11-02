import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const plan = read("docs/planning/db019-p14-field-review.json");
const source = read("docs/planning/db-pass4-columns-db07_projects.json");

const sourceTableNames = ["project_sprint", "project_task", "project_task_comment", "project_activity_event"];

test("DB19-P14 exact 94 identity census is complete, unique and pinned to source", () => {
  assert.equal(plan.id, "DB19-P14");
  assert.equal(plan.sourceSha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
  assert.equal(plan.sourceFieldCount, 94);
  assert.deepEqual(plan.sourceTables, sourceTableNames);
  assert.equal(plan.fields.length, 94);

  const sourceRows = source.tables
    .filter(table => sourceTableNames.includes(table.table))
    .flatMap(table => table.rows);
  assert.equal(sourceRows.length, 94, "Source inventory must match expected field count");

  const identity = row => `${row.sourceTable ?? row.legacyTable}.${row.sourceColumn ?? row.legacyColumn}`;
  const expected = new Set(sourceRows.map(identity));
  const actual = new Set(plan.fields.map(identity));
  assert.equal(actual.size, 94, "No duplicate source column identities in review");
  assert.deepEqual(actual, expected, "No omitted, invented or misassigned DB19-P14 source fields");
});

test("DB19-P14 every field has a targetCandidate and disposition", () => {
  for (const field of plan.fields) {
    assert.ok(
      typeof field.targetCandidate === "string" && field.targetCandidate.length > 0,
      `${field.sourceTable}.${field.sourceColumn} must have a targetCandidate`
    );
    assert.ok(
      typeof field.disposition === "string" && field.disposition.length > 0,
      `${field.sourceTable}.${field.sourceColumn} must have a disposition`
    );
    assert.equal(
      typeof field.semanticRisk, "string",
      `${field.sourceTable}.${field.sourceColumn} must have semanticRisk`
    );
    assert.equal(field.sourceVerifiedAtSha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
  }
});

test("DB19-P14 does not claim runtime verification (source-only at this gate)", () => {
  for (const field of plan.fields) {
    assert.equal(field.runtimeVerified, false,
      `${field.sourceTable}.${field.sourceColumn}: runtimeVerified must be false at source gate`);
    assert.equal(plan.runtimeVerifiedCount, 0);
  }
  assert.equal(plan.testEvidenceStatus, "SOURCE_QUALITY_GATE_ONLY_NOT_RUNTIME_CERTIFIED");
});

test("DB19-P14 source SHA pinned to frozen legacy backend", () => {
  const FROZEN_LEGACY_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
  assert.equal(plan.sourceSha, FROZEN_LEGACY_SHA, "DB19-P14 source oracle must be pinned");
  assert.equal(source.sourceSha, FROZEN_LEGACY_SHA, "Source inventory must reference same frozen SHA");
  for (const field of plan.fields) {
    assert.equal(field.sourceVerifiedAtSha, FROZEN_LEGACY_SHA,
      `${field.sourceTable}.${field.sourceColumn} must be verified at frozen SHA`);
  }
});
