#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root,p),"utf8");
const review = JSON.parse(read("docs/planning/db05-chat06-source-semantic-review.json"));
const inventoryText = read("docs/planning/db-pass4-columns-db05_courses_and_content.json");
const canonical = JSON.parse(inventoryText);
const blobSha = createHash("sha1")
  .update("blob " + Buffer.byteLength(inventoryText) + "\0")
  .update(inventoryText).digest("hex");
const canonicalRows = canonical.tables.flatMap(t=>t.rows);
const canonicalMap = new Map(canonicalRows.map(r=>[r.legacyTable+"."+r.legacyColumn,r]));
const reviewMap = new Map(review.fields.map(r=>[r.source,r]));

test("DB008 exact canonical Git blob pinned, not only a stale filename", () => {
  assert.equal(review.source.inventoryBlobSha, blobSha);
  assert.equal(review.sourceReconciliation.canonicalInventoryBlobSha, blobSha);
  assert.equal(review.sourceReconciliation.previousInventoryBlobSha,
    "f21860ff81d2fc5eda205ccaab715d213b20df5e");
});

test("DB008 92/92 identities same, none missing, added or duplicated", () => {
  assert.equal(canonicalRows.length,92);
  assert.equal(canonicalMap.size,92);
  assert.equal(review.fields.length,92);
  assert.equal(reviewMap.size,92);
  assert.deepEqual([...canonicalMap.keys()].sort(),[...reviewMap.keys()].sort());
  assert.equal(review.sourceReconciliation.fieldIdentitiesAddedOrRemoved,0);
});

test("DB008 all 39 updated canonical proposals AND dispositions are preserved", () => {
  const reconciled=review.fields.filter(r=>r.canonicalInventoryReview);
  assert.equal(reconciled.length,39);
  assert.equal(review.sourceReconciliation.updatedSemanticDispositionEvidenceRows,39);
  assert.deepEqual(reconciled.map(r=>r.source).sort(),
    [...review.sourceReconciliation.fieldsUpdated].sort());
  for(const r of reconciled){
    const canonicalRow=canonicalMap.get(r.source);
    assert.equal(r.canonicalInventoryReview.proposedSemanticMapping,
      canonicalRow.proposedSemanticMapping, r.source);
    assert.equal(r.canonicalInventoryReview.db008SourceDisposition,
      canonicalRow.db008SourceDisposition, r.source);
    assert.deepEqual(r.canonicalInventoryReview.db008Evidence,
      canonicalRow.db008Evidence, r.source);
    assert.equal(r.canonicalInventoryReview.reconciliation,
      "SOURCE_ANNOTATION_ONLY_NOT_VERIFIED");
  }
});

test("DB008 unresolved historical and active tombstone rows do not auto-retire", () => {
  const historical=["course.default_subscription_days","course.formal_title"];
  for(const id of historical){
    const r=reviewMap.get(id);
    assert.equal(r.classification,"MISSING_OR_UNPROVEN",id);
    assert.match(r.canonicalInventoryReview.db008SourceDisposition,
      /PRODUCT_DECISION/,id);
  }
  const tombstone=reviewMap.get("learner_content_progress.is_deleted");
  assert.equal(tombstone.classification,"UNREGISTERED_DRAFT");
  assert.match(tombstone.canonicalInventoryReview.db008SourceDisposition,/ACTIVE_LEGACY_REPOSITORY/);
});

test("DB008 source-only annotations never auto-certify mappings or DB", () => {
  for (const row of canonicalRows) {
    assert.equal(row.verifiedMapping,null,row.legacyTable+"."+row.legacyColumn);
  }
  for (const row of review.fields) {
    assert.equal(row.semanticVerification,"NOT_VERIFIED",row.source);
    assert.equal(row.runtimeDatabaseVerification,"NOT_RUN",row.source);
    assert.notEqual(row.producerConsumerVerification,"VERIFIED",row.source);
  }
  assert.equal(review.counts.sourceFields,92);
  assert.deepEqual(review.counts.byClass,{
    SOURCE_CANDIDATE:30, UNREGISTERED_DRAFT:38,
    REMODELED_NEEDS_PROOF:22, MISSING_OR_UNPROVEN:2,
  });
});
