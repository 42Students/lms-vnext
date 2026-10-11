import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const guard = read("../scripts/sql/db05-content-delivery-order-scope.draft.sql");
const base = read("../docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql");
const order = read("../src/db/schema/lesson-content-order-staged.ts");
const writer = read("../src/modules/courses/lesson-content-order-service.ts");
const delivery = read("../src/modules/courses/delivery-service.ts");
const contract = read("../docs/planning/db05-content-order-delivery-scope-contract.md");

test("scope guard supplements one unregistered lesson-content order table", () => {
  assert.match(guard, /UNREGISTERED SOURCE-ONLY SQL/);
  assert.match(base, /lesson_content_delivery_sequences/);
  assert.match(order, /export const lessonContentDeliverySequences = pgTable/);
  assert.doesNotMatch(guard, /CREATE TABLE|ALTER TABLE|CREATE INDEX/i);
  assert.match(guard, /ON lesson_content_delivery_sequences/);
});

test("content order requires same offering and content delivery", () => {
  assert.match(writer, /lesson\.offeringId !==\s*delivery\.offeringId/);
  assert.match(guard, /content_offering_id IS DISTINCT FROM target_delivery_offering_id/);
  assert.match(guard, /content_scoped_delivery_id IS DISTINCT FROM NEW\.delivery_id/);
  assert.match(guard, /INNER JOIN course_learning_paths path/);
  assert.match(guard, /INNER JOIN course_section_deliveries delivery/);
  assert.match(guard, /content_status = 'ARCHIVED'/);
});

test("tenant, cohort and academic period all match delivery service invariant", () => {
  assert.match(delivery, /offering\.collegeId !== section\.collegeId/);
  assert.match(delivery, /offering\.cohortId !== section\.cohortId/);
  assert.match(delivery, /offering\.academicPeriodId !==\s*section\.academicPeriodId/);
  for (const fragment of [
    "offering_college_id IS DISTINCT FROM owning_course_college_id",
    "offering_college_id IS DISTINCT FROM target_section_college_id",
    "offering_cohort_id IS DISTINCT FROM target_section_cohort_id",
    "offering_period_id IS DISTINCT FROM target_section_period_id",
  ]) {
    assert.ok(guard.includes(fragment), fragment);
  }
});

test("per-lesson sequence uniqueness and upstream mutation remain open", () => {
  assert.match(order, /lesson_content_delivery_sequences_delivery_sequence_idx/);
  assert.match(contract, /UNIQUE\(delivery_id,lesson_id,sequence\)/);
  assert.match(contract, /nonunique/);
  assert.match(contract, /upstream changes/);
  assert.match(contract, /No Node\/PostgreSQL\/CI acceptance was executed/);
});
