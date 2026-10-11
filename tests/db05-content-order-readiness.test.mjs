import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const readiness = JSON.parse(
  read("../docs/planning/db05-migration-readiness-manifest.json"),
);
const guard = read("../scripts/sql/db05-content-delivery-order-scope.draft.sql");
const contract = read("../docs/planning/db05-content-order-delivery-scope-contract.md");

test("DB05 order scope is a companion, not an extra migration", () => {
  assert.equal(readiness.artifacts.length, 7);
  const c = readiness.crossDomainCompanions.find(
    (entry) => entry.id === "DB05_CONTENT_DELIVERY_ORDER_SCOPE",
  );
  assert.ok(c);
  assert.equal(
    c.path,
    "scripts/sql/db05-content-delivery-order-scope.draft.sql",
  );
  assert.match(c.baseCandidate, /db05-lesson-content-delivery-order-candidate/);
  assert.equal(c.registered, false);
  assert.equal(c.postgresExecuted, false);
  assert.equal(c.readyForProduction, false);
  assert.ok(c.dependencies.includes("PER_LESSON_DELIVERY_SEQUENCE_UNIQUE_POLICY"));
  assert.match(guard, /UNREGISTERED SOURCE-ONLY SQL/);
});

test("delivery offering, term and per-lesson uniqueness remain not proven", () => {
  for (const id of [
    "COURSE_CONTENT_DELIVERY_ORDER_SCOPE_NEGATIVE",
    "COURSE_CONTENT_DELIVERY_ORDER_UNIQUE_PER_LESSON",
    "COURSE_CONTENT_DELIVERY_ORDER_UPSTREAM_REPARENT_INTEGRITY",
  ]) {
    const gate = readiness.gates.find((candidate) => candidate.id === id);
    assert.ok(gate, id);
    assert.notEqual(gate.status, "PASS", id);
  }
  assert.match(contract, /UNIQUE\(delivery_id,lesson_id,sequence\)/);
  assert.match(contract, /upstream changes/);
  assert.match(guard, /offering_period_id IS DISTINCT FROM target_section_period_id/);
});
