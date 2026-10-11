import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const readiness = JSON.parse(
  read("../docs/planning/db05-migration-readiness-manifest.json"),
);
const receiptSql = read(
  "../scripts/sql/db05-course-receipt-college-scope.draft.sql",
);

test("private receipt guard is cross-domain companion, not eighth DB05 migration", () => {
  assert.equal(readiness.artifacts.length, 7);
  const entry = readiness.crossDomainCompanions.find(
    (item) => item.id === "DB05_DB06_COURSE_PRIVATE_RECEIPT_SCOPE",
  );
  assert.ok(entry);
  assert.equal(
    entry.path,
    "scripts/sql/db05-course-receipt-college-scope.draft.sql",
  );
  assert.match(entry.baseCandidate, /db06-assignment-private-files-candidate\.sql/);
  assert.match(entry.db16Overlay, /db16-private-object-receipt-overlay-candidate\.sql/);
  assert.equal(entry.registered, false);
  assert.equal(entry.postgresExecuted, false);
  assert.equal(entry.readyForProduction, false);
  assert.ok(entry.dependencies.length >= 5);
  assert.doesNotMatch(receiptSql, /CREATE TABLE|ALTER TABLE|CREATE INDEX/i);
});

test("receipt tenant/consumption/upstream gates fail closed until real DB proof", () => {
  for (const id of [
    "COURSE_PRIVATE_RECEIPT_SAME_COLLEGE_NEGATIVE",
    "COURSE_PRIVATE_RECEIPT_CONSUMPTION_AND_ATTESTATION",
    "COURSE_PRIVATE_RECEIPT_UPSTREAM_REPARENT",
  ]) {
    const gate = readiness.gates.find((candidate) => candidate.id === id);
    assert.ok(gate, id);
    assert.notEqual(gate.status, "PASS");
  }
  assert.match(receiptSql, /owner_college_id IS DISTINCT FROM NEW\.college_id/);
  assert.match(receiptSql, /target_period_college_id IS DISTINCT FROM NEW\.college_id/);
  assert.match(receiptSql, /submission_membership_id IS DISTINCT FROM NEW\.owner_membership_id/);
});
