import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = p => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), p), "utf8"));
const source = read("docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json");
const audit = read("docs/planning/database-parity-db09-field-ledger.json");
const key = x => x.legacyTable + "." + x.legacyColumn;

test("DB09 ledger tracks all 31 source tables and every one of 279 distinct fields", () => {
  const legacy = source.tables.flatMap(t => t.rows.map(r => ({
    legacyTable: t.table,
    legacyColumn: r.legacyColumn,
    legacySource: r.sourceEvidence || t.sourceBase,
  })));
  assert.equal(source.counts.tables, 31);
  assert.equal(source.counts.fields, 279);
  assert.equal(legacy.length, source.counts.fields);
  assert.equal(audit.totalFieldCount, legacy.length);
  assert.equal(audit.records.length, legacy.length);
  assert.equal(new Set(legacy.map(key)).size, legacy.length, "Source fields must be unique");
  assert.equal(new Set(audit.records.map(key)).size, audit.records.length, "Ledger must be duplicate-free");
  assert.deepEqual(audit.records.map(key).sort(), legacy.map(key).sort());
  assert.equal(new Set(audit.records.map(r => r.id)).size, audit.records.length);
  const sourceByKey = new Map(legacy.map(r => [key(r), r]));
  for (const entry of audit.records) {
    assert.equal(entry.legacySource, sourceByKey.get(key(entry)).legacySource);
    assert.ok(entry.id.startsWith("DB09-"));
  }
});

test("DB09 source SHAs remain explicit and counts cannot be silently inflated", () => {
  assert.equal(audit.domain, source.domain);
  assert.equal(audit.legacyBackendSha, source.sourceSha);
  assert.equal(audit.initialVnextMainSha, source.vnextSha);
  assert.equal(audit.sourceOnly, true, "Only evidence-backed schema checks may remove source-only qualifier");
  assert.equal(audit.reviewedFieldCount, audit.records.filter(x => x.status !== "UNMAPPED").length);
  assert.equal(audit.verifiedFieldCount, audit.records.filter(x => x.status === "WORKFLOW_VERIFIED").length);
});

test("DB09 fields cannot claim implemented/verified without a target and evidence", () => {
  const legal = new Set(["UNMAPPED", "MAPPED", "IMPLEMENTED", "DB_TESTED", "WORKFLOW_VERIFIED", "REDESIGNED", "RETIRED", "BLOCKED"]);
  for (const r of audit.records) {
    assert.ok(legal.has(r.status), key(r) + " has invalid status");
    if (["MAPPED","IMPLEMENTED","DB_TESTED","WORKFLOW_VERIFIED"].includes(r.status)) {
      assert.ok(r.mappingTarget, key(r) + " lacks target");
      assert.ok(r.semanticDefinition, key(r) + " lacks semantic evidence");
      assert.ok(r.producerPaths.length && r.consumerPaths.length, key(r) + " lacks producer/consumer paths");
    }
    if (["DB_TESTED", "WORKFLOW_VERIFIED"].includes(r.status))
      assert.ok(r.dbTestEvidence.length && r.reviewedAtLegacySha, key(r) + " lacks executed DB evidence/legacy SHA");
    if (r.status === "WORKFLOW_VERIFIED")
      assert.ok(r.workflowEvidence.length, key(r) + " lacks workflow evidence");
    if (["REDESIGNED","RETIRED"].includes(r.status))
      assert.ok(r.semanticDefinition && r.constraintAndLifecycleEvidence, key(r) + " lacks signed-off exception");
  }
});
