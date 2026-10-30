import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = path => readFileSync(path, "utf8");
const source = JSON.parse(file("docs/planning/db-pass4-columns-db08_placement_policy_and_outcomes.json"));
const review = JSON.parse(file("docs/planning/database-parity-db08-field-ledger.json"));
const contract = file("docs/planning/database-parity-db08-execution.md");
const placements = file("src/db/schema/placements.ts");

test("DB011 covers every frozen placement source table/field exactly once without a false verified mapping", () => {
  assert.equal(source.counts.tables, 18);
  assert.equal(source.counts.fields, 280);
  assert.equal(source.counts.sourceReviewedFields, 280);
  assert.equal(source.counts.domainCandidateCoveredFields, 280);
  assert.equal(source.counts.runtimeSemanticVerifiedFields, 0);
  assert.equal(review.counts.legacyTables, 18);
  assert.equal(review.counts.legacyFields, 280);
  assert.equal(review.counts.verifiedFields, 0);
  assert.equal(review.tables.length, 18);
  const expected = source.tables.flatMap(t => t.rows.map(f => t.table + "." + f.legacyColumn));
  const actual = review.tables.flatMap(t => t.fields.map(f => t.legacyTable + "." + f.legacyColumn));
  assert.equal(new Set(expected).size, 280);
  assert.equal(new Set(actual).size, 280);
  assert.deepEqual(actual.toSorted(), expected.toSorted());
  for (const table of review.tables) {
    assert.ok(table.disposition && table.priority && table.candidateVnextTables?.length > 0);
    assert.equal(table.fieldCount, table.fields.length);
    for (const field of table.fields) {
      assert.equal(field.status, "UNVERIFIED");
      assert.equal(field.verifiedMapping, null);
      assert.equal(field.dbTestEvidence, null);
    }
  }
  assert.equal(source.sourceSha, review.capturedFrom.legacyBackendSha);
});

test("DB011 identifies inherited eligibility, explicit registration history, and season retirement as real gaps", () => {
  const findings = source.sourceReview.criticalFindings.join("\n");
  for (const keyword of ["V188","season","registration","debarment","job.counts_as_placed","outcome_label","outcome_detail","offer","actor"]) {
    assert.match(findings, new RegExp(keyword.replaceAll(".", "\\."), "i"), keyword);
  }
  const required = ["placement_batch","placement_eligibility","placement_eligibility_event",
    "placement_registration","placement_debarment","external_placement","job_offer",
    "placement_season","round_result"];
  for (const family of required) assert.ok(review.tables.some(t => t.legacyTable === family), family);
  assert.match(contract, /NOT IMPLEMENTED OR DATABASE-VERIFIED/);
  assert.match(contract, /NOT_DECIDED/);
  assert.match(contract, /atomic undo/i);
  assert.match(contract, /counts_as_placed/);
  assert.match(placements, /export const placementSeasons/);
  assert.match(source.sourceReview.completionMeaning, /downstream gates/);
});

test("DB011 staged candidates are source-only and do not certify the registered database phase", () => {
  assert.equal(review.gate.disposablePostgresReplay, "NOT_RUN");
  assert.equal(review.gate.fieldMappingsVerified, 0);
  assert.equal(review.gate.fieldsUnverified, 280);
  assert.equal(review.gate.bSchemasStaged.length, 2);
  assert.equal(review.gate.bMigrationStaged.length, 2);
  assert.ok(review.gate.cSchemasStaged.length >= 1);
  for(const f of [...review.gate.bSchemasStaged,...review.gate.bMigrationStaged,...review.gate.cSchemasStaged]) {
    assert.ok(file(f).length > 200, "Missing source staging candidate " + f);
  }
  for(const finding of review.gate.blockingFindings) assert.ok(finding.length > 35);
});
