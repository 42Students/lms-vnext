import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => readFileSync(path.join(root, p));
const get = (p) => JSON.parse(load(p).toString("utf8"));
const typeReview = get("docs/planning/db01-chat02-type-nullability-review.json");
const source = get("docs/planning/db-pass4-columns-db01_identity_and_tenancy.json");
const snapshot = get(typeReview.evidence.snapshotPresenceLedger);
const sourceRows = new Map(source.tables.flatMap((t) =>
  t.rows.map((r) => [`${t.table}.${r.legacyColumn}`, r]),
));
const snapshotRows = new Map(snapshot.rows.map((r) => [r.legacyField, r]));
const blob = (buffer) => createHash("sha1")
  .update(`blob ${buffer.length}\0`)
  .update(buffer)
  .digest("hex");

test("DB01 type review is pinned to exact source and committed snapshot reports", () => {
  assert.equal(
    blob(load("docs/planning/db-pass4-columns-db01_identity_and_tenancy.json")),
    typeReview.evidence.sourceInventoryBlob,
  );
  assert.equal(
    blob(load(typeReview.evidence.snapshotPresenceLedger)),
    typeReview.evidence.snapshotPresenceBlob,
  );
  assert.equal(source.sourceSha, typeReview.evidence.legacySource);
  assert.equal(typeReview.counts.directPhysicalCandidates, 76);
  assert.equal(typeReview.counts.vnextRuntimeSemanticsVerified, 0);
});

test("every exact DB01 snapshot presence mapping has a matching type/null review", () => {
  const direct = snapshot.rows.filter((r) =>
    r.structuralStatus === "SINGLE_COLUMN_DECLARED_IN_SNAPSHOT",
  );
  assert.equal(direct.length, typeReview.rows.length);
  const seen = new Set();
  let counted = {};
  for (const row of typeReview.rows) {
    assert.ok(!seen.has(row.legacyField), `duplicate: ${row.legacyField}`);
    seen.add(row.legacyField);
    const old = sourceRows.get(row.legacyField);
    const current = snapshotRows.get(row.legacyField);
    assert.ok(old && current, `unrecognized: ${row.legacyField}`);
    assert.equal(current.structuralStatus, "SINGLE_COLUMN_DECLARED_IN_SNAPSHOT");
    assert.equal(row.legacy.sqlType, old.sourceType);
    assert.equal(row.legacy.nullable, old.nullable);
    assert.equal(row.vnext.pgType, current.presence.pgType);
    assert.equal(row.vnext.nullable, current.presence.nullable);
    assert.equal(row.decision, "REQUIRES_SEMANTIC_REVIEW");
    assert.equal(row.runtimeVerified, false);
    for (const flag of row.reviewFlags) counted[flag] = (counted[flag] ?? 0) + 1;
    if (old.nullable === "NULL_ALLOWED" && !current.presence.nullable) {
      assert.ok(row.reviewFlags.includes("LEGACY_OPTIONAL_TARGET_REQUIRED"));
    }
    if (old.nullable === "NOT_NULL" && current.presence.nullable) {
      assert.ok(row.reviewFlags.includes("LEGACY_REQUIRED_TARGET_NULLABLE"));
    }
    if (row.reviewFlags.includes("POSSIBLE_VARCHAR_CAPACITY_NARROWING")) {
      const oldN = +(old.sourceType.match(/varchar\((\d+)\)/i)?.[1] ?? NaN);
      const newN = +(current.presence.pgType.match(/varchar\((\d+)\)/i)?.[1] ?? NaN);
      assert.ok(Number.isFinite(oldN) && Number.isFinite(newN) && newN < oldN);
    }
  }
  assert.deepEqual(counted, typeReview.counts.flagOccurrences);
  assert.equal(
    typeReview.rows.filter((r) => r.reviewFlags.length > 0).length,
    typeReview.counts.fieldsWithFlags,
  );
  for (const row of direct) assert.ok(seen.has(row.legacyField));
});

test("type-family redesigns must be explicitly reviewed before declaring DB parity", () => {
  const required = new Set([
    "department.is_deleted",
    "faculty.department",
    "faculty.faculty_type",
    "recruiter.is_deleted",
    "recruiter_college_access.is_deleted",
  ]);
  const found = new Set(typeReview.rows
    .filter((r) => r.reviewFlags.includes("SEMANTIC_TYPE_FAMILY_REDESIGN"))
    .map((r) => r.legacyField));
  assert.deepEqual(found, required);
  assert.equal(typeReview.counts.flagOccurrences.SEMANTIC_TYPE_FAMILY_REDESIGN, 5);
});
