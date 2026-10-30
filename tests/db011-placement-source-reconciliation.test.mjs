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

test("DB011 source inventory remains honest about verified fields while newer registrations are detected", () => {
  assert.equal(review.gate.disposablePostgresReplay, "NOT_RUN");
  assert.equal(review.gate.fieldMappingsVerified, 0);
  assert.equal(review.gate.fieldsUnverified, 280);
  // The 2026-10-11 review lists two obsolete scripts/sql staging paths.
  // Current main has since registered DB08-B in journal migration 0071,
  // and exports the real DB08-B/C Drizzle schemas. Verify the live source
  // rather than misreporting the historical paths as present.
  const journal = JSON.parse(file("drizzle/meta/_journal.json"));
  assert.ok(journal.entries.some(e => e.tag === "0071_db08_registration_debarments"));
  const migration = file("drizzle/0071_db08_registration_debarments.sql");
  assert.match(migration, /CREATE TABLE "placement_batch_registrations"/);
  assert.match(migration, /CREATE TABLE "placement_debarments"/);
  const barrel = file("src/db/schema/index.ts");
  for(const p of ["placement-registration","placement-debarments","placement-external"]) {
    assert.ok(barrel.includes('export * from "./' + p + '";'), p);
    assert.ok(file("src/db/schema/" + p + ".ts").length > 200);
  }
  assert.match(file("src/db/schema/placement-external.ts"), /Registered in migration 0094/);
  for(const finding of review.gate.blockingFindings) assert.ok(finding.length > 35);
});
