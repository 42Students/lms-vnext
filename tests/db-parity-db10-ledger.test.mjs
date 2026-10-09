import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = p => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), p), "utf8"));
const source = read("docs/planning/db-pass4-columns-db10_shared_operations.json");
const ledger = read("docs/planning/database-parity-db10-field-ledger.json");
const key = r => r.legacyTable + "." + r.legacyColumn;

test("DB10 contains every one of the 221 source fields exactly once", () => {
  const expected = source.tables.flatMap(t =>
    t.rows.map(r => ({
      legacyTable: t.table,
      legacyColumn: r.legacyColumn,
      source: r.sourceEvidence || t.sourceBase,
    })),
  );
  assert.equal(source.counts.tables, 19);
  assert.equal(expected.length, source.counts.fields);
  assert.equal(expected.length, 221);
  assert.equal(ledger.records.length, 221);
  assert.equal(new Set(expected.map(key)).size, expected.length);
  assert.equal(new Set(ledger.records.map(key)).size, ledger.records.length);
  assert.deepEqual(
    ledger.records.map(key).sort(),
    expected.map(key).sort(),
  );
  assert.equal(new Set(ledger.records.map(x => x.id)).size, ledger.records.length);
  const byKey = new Map(expected.map(r => [key(r), r]));
  for (const r of ledger.records) {
    assert.equal(r.source, byKey.get(key(r))?.source);
  }
});

test("DB10 source pin and completion counts are evidence-led", () => {
  assert.equal(ledger.legacyBackendSha, source.sourceSha);
  assert.equal(ledger.originalVnextMainSha, source.vnextSha);
  assert.equal(ledger.domain, source.domain);
  assert.equal(ledger.counts.tables, 19);
  assert.equal(ledger.counts.fields, 221);
  assert.equal(ledger.counts.unmapped, ledger.records.filter(r => r.status === "UNMAPPED").length);
  assert.equal(ledger.counts.verified, ledger.records.filter(r => r.status === "WORKFLOW_VERIFIED").length);
  assert.equal(ledger.sourceOnly, true);
});

test("DB10 mapped fields must carry tested target and workflow evidence", () => {
  const allowed = new Set([
    "UNMAPPED", "MAPPED", "IMPLEMENTED", "DB_TESTED",
    "WORKFLOW_VERIFIED", "REDESIGNED", "RETIRED", "BLOCKED",
  ]);
  for (const r of ledger.records) {
    assert.ok(allowed.has(r.status), key(r));
    if (["MAPPED", "IMPLEMENTED", "DB_TESTED", "WORKFLOW_VERIFIED"].includes(r.status)) {
      assert.ok(r.mappingTarget && r.semantics, key(r) + " requires mapped semantics");
      assert.ok(r.writers.length && r.readers.length, key(r) + " requires producer/consumer evidence");
    }
    if (["DB_TESTED", "WORKFLOW_VERIFIED"].includes(r.status)) {
      assert.ok(r.validationEvidence.length && r.verifiedLegacySha, key(r) + " requires executed DB evidence");
    }
    if (["REDESIGNED", "RETIRED"].includes(r.status)) {
      assert.ok(r.semantics && r.historyAndDeleteSemantics, key(r) + " requires explicit decision");
    }
  }
});
