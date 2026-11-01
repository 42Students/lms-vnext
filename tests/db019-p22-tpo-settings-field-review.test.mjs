import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = JSON.parse(readFileSync("docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json", "utf8"));
const review = JSON.parse(readFileSync("docs/planning/db019-p22-tpo-settings-field-review.json", "utf8"));
const tables = new Set([
  "college_placement_rules", "college_what_companies_see",
  "tpo_college_settings", "tpo_coordinator_assignment",
  "tpo_team_member", "tpo_user_prefs",
]);
const key = (table, column) => `${table}.${column}`;

test("DB19-P22 accounts for the exact 49 frozen DB09 TPO policy/team fields", () => {
  const expected = source.tables
    .filter(table => tables.has(table.table))
    .flatMap(table => table.rows.map(row => key(table.table, row.legacyColumn))).sort();
  const actual = review.fields.map(row => key(row.sourceTable, row.sourceColumn)).sort();
  assert.equal(review.id, "DB19-P22");
  assert.equal(review.sourceSha, source.sourceSha);
  assert.equal(review.sourceFieldCount, 49);
  assert.equal(expected.length, 49);
  assert.equal(actual.length, 49);
  assert.equal(new Set(actual).size, 49);
  assert.deepEqual(actual, expected);
  assert.deepEqual([...review.sourceTables].sort(), [...tables].sort());
});

test("P22 historical coordinator retirement is a V201 evidence candidate, not an approval", () => {
  const migration = readFileSync(
    "docs/legacy-source/backend/src/main/resources/db/migration/V201__drop_tpo_coordinator_roles.sql",
    "utf8",
  );
  assert.match(migration, /DROP TABLE IF EXISTS tpo_coordinator_assignment/);
  assert.match(migration, /DELETE FROM tpo_team_member WHERE role <> 'TPO_ADMIN'/);
  assert.match(migration, /DROP COLUMN department/);
  const candidates = review.fields.filter(row =>
    row.sourceDecision === "HISTORICAL_RETIREMENT_CANDIDATE_V201_REQUIRES_APPROVAL");
  assert.equal(candidates.length, 8);
  assert.deepEqual(
    candidates.map(row => key(row.sourceTable,row.sourceColumn)).sort(),
    [...review.fields.filter(row => row.sourceTable === "tpo_coordinator_assignment")
      .map(row => key(row.sourceTable,row.sourceColumn)), "tpo_team_member.department"].sort(),
  );
  assert.ok(candidates.every(row => !row.retirementApproved));
});

test("No proposed disposition is falsely certified as executed runtime or consumer proof", () => {
  assert.equal(review.runtimeVerifiedCount, 0);
  for (const row of review.fields) {
    assert.ok(row.unresolvedSemanticEvidence, key(row.sourceTable,row.sourceColumn));
    assert.ok(["HISTORICAL_RETIREMENT_CANDIDATE_V201_REQUIRES_APPROVAL",
      "PROPOSED_ACTIVE_FIELD_MAPPING"].includes(row.sourceDecision));
    assert.equal(row.runtimeVerified, false);
    assert.equal(row.consumerVerified, false);
    assert.equal(row.producerVerified, false);
    assert.equal(row.retirementApproved, false);
    if (row.sourceDecision === "PROPOSED_ACTIVE_FIELD_MAPPING") assert.ok(row.proposedTarget);
  }
});
