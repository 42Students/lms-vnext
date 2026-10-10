// DB-007 source-ledger consistency guard. This is NOT a PostgreSQL test.
// Run: node scripts/verify-db04-source-review.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const canonical = JSON.parse(readFileSync(
  "docs/planning/db-pass4-columns-db04_profiles_and_verification.json", "utf8"));
const proposals = JSON.parse(readFileSync(
  "docs/planning/db04-field-crosswalk-proposals.json", "utf8"));

const rows = canonical.tables.flatMap(t => t.rows);
const pRows = proposals.rows;
const indexed = new Map(pRows.map(r => [r.legacyTable + "." + r.legacyColumn, r]));
const counts = {
  candidateFields: rows.length,
  reviewed: 0,
  verificationDdl: 0,
  activeLegacyQualImage: 0,
  unknownCurrentUsage: 0,
  runtimeVerified: 0,
  approvedRetired: 0,
};

assert.equal(rows.length, 103, "Frozen DB04 candidate count drift: re-audit baseline");
assert.equal(pRows.length, 103, "Proposal row count drift");
assert.equal(indexed.size, pRows.length, "Duplicate proposed legacy table.column");

for (const row of rows) {
  const key = row.legacyTable + "." + row.legacyColumn;
  const other = indexed.get(key);
  assert.ok(other, "Missing proposal " + key);
  assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS",
    "Do not promote source review to semantic verification: " + key);
  assert.equal(other.semanticVerification, "UNVERIFIED",
    "Proposal incorrectly certified: " + key);
  assert.equal(other.sqlExecution, "NOT_EXECUTED",
    "Do not claim runtime proof without executed PostgreSQL evidence: " + key);
  assert.ok(
    ["UNDECIDED", "ACTIVE_SOURCE_CONFIRMED", "UNRESOLVED_RETIREMENT_CANDIDATE"]
      .includes(other.activeOrRetired),
    "Unexpected final/approved disposition without DB proof: " + key);
  if (other.activeOrRetired === "ACTIVE_SOURCE_CONFIRMED") {
    assert.equal(row.sourceReview?.status,
      "ACTIVE_LEGACY_SOURCE_AND_CONSUMER_REVIEWED_NOT_VERIFIED",
      "An active source classification must cite actual workflow evidence: " + key);
  }
  if (other.activeOrRetired === "UNRESOLVED_RETIREMENT_CANDIDATE") {
    assert.equal(row.sourceReview?.status,
      "HISTORICAL_SCHEMA_REVIEWED_ACTIVE_USAGE_UNPROVEN",
      "A retirement candidate is NOT approved retirement: " + key);
  }
  assert.deepEqual(row.sourceReview, other.sourceReview,
    "Canonical and proposal source evidence diverged: " + key);
  const review = row.sourceReview;
  assert.ok(review && review.legacyOracleSha,
    "Missing pinned source review evidence: " + key);
  assert.equal(review.legacyOracleSha,
    "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
    "Legacy backend oracle moved; recheck affected source evidence: " + key);
  counts.reviewed++;
  if (review.status === "LEGACY_DDL_TO_STAGED_TARGET_COMPARED_NOT_VERIFIED") {
    counts.verificationDdl++;
  } else if (review.status === "ACTIVE_LEGACY_SOURCE_AND_CONSUMER_REVIEWED_NOT_VERIFIED") {
    counts.activeLegacyQualImage++;
  } else if (review.status === "HISTORICAL_SCHEMA_REVIEWED_ACTIVE_USAGE_UNPROVEN") {
    counts.unknownCurrentUsage++;
  } else {
    throw Error("Unrecognized source review classification: " + key);
  }
}
assert.equal(counts.verificationDdl, 43);
assert.equal(counts.activeLegacyQualImage, 27);
assert.equal(counts.unknownCurrentUsage, 33);
assert.equal(counts.reviewed, 103);
assert.equal(canonical.sourceReviewSummary.formalSemanticOrRuntimeVerifiedFields, 0);
assert.equal(canonical.sourceReviewSummary.retirementsApproved, 0);
assert.equal(proposals.counts.verified, 0);
assert.equal(proposals.counts.retirementApproved, 0);

console.log(JSON.stringify({
  ...counts,
  classification: "SOURCE_REVIEW_ONLY_NOT_SEMANTICALLY_OR_RUNTIME_VERIFIED",
  postgresExecution: "NOT_EXECUTED",
}, null, 2));
