import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const inventory = JSON.parse(readFileSync("docs/planning/db-pass4-columns-db10_shared_operations.json", "utf8"));
const review = JSON.parse(readFileSync("docs/planning/db019-p30-skills-field-review.json", "utf8"));
const sourceTables = new Set(["skills", "skill_synonyms", "skill_usage"]);
const id = row => row.sourceTable + "." + row.sourceColumn;

test("DB19-P30 source review preserves the exact frozen 15-field skills subset", () => {
  assert.equal(review.id, "DB19-P30");
  assert.equal(review.sourceSha, inventory.sourceSha);
  const source = inventory.tables.filter(table => sourceTables.has(table.table))
    .flatMap(table => table.rows.map(row => table.table + "." + row.legacyColumn)).sort();
  const reviewed = review.fields.map(id).sort();
  assert.equal(source.length, 15);
  assert.equal(reviewed.length, 15);
  assert.equal(new Set(reviewed).size, 15);
  assert.deepEqual(reviewed, source);
  assert.deepEqual([...review.sourceTables].sort(), [...sourceTables].sort());
});

test("DB19-P30 cannot silently promote source proposals into runtime proof", () => {
  for (const field of review.fields) {
    assert.equal(field.decision, "PROPOSED_ACTIVE_FIELD_MAPPING", id(field));
    assert.equal(field.runtimeVerified, false, id(field));
    assert.equal(field.producerVerified, false, id(field));
    assert.equal(field.consumerVerified, false, id(field));
    assert.equal(field.retirementApproved, false, id(field));
    assert.ok(field.proposedTarget && field.reviewNote && field.risk, id(field));
  }
  assert.match(review.recordType, /SOURCE_REVIEW_NOT_FINAL_DISPOSITION/);
});
