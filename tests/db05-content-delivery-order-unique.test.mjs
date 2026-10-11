import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = (path) => readFileSync(join(root, path), "utf8");
const draft = source("scripts/sql/db05-content-delivery-order-unique-lesson.draft.sql");
const other = source("scripts/sql/db05-content-delivery-order-scope.draft.sql");
const staged = source("src/db/schema/lesson-content-order-staged.ts");
const writer = source("src/modules/courses/lesson-content-order-service.ts");
const reader = source("src/modules/courses/lesson-content-order-readiness.ts");

test("DB05 staged order candidate witnesses the owning lesson, not a global sequence", () => {
  assert.match(staged, /lessonId: uuid\("lesson_id"\)\.notNull\(\)/);
  assert.match(draft, /ADD COLUMN lesson_id uuid/);
  assert.match(draft, /SET lesson_id = content\.lesson_id/);
  assert.match(draft, /ALTER COLUMN lesson_id SET NOT NULL/);
  assert.match(draft, /UNIQUE \(id, lesson_id\)/);
  assert.match(draft, /FOREIGN KEY \(lesson_content_id, lesson_id\)/);
  assert.match(draft, /REFERENCES lesson_contents \(id, lesson_id\)/);
  assert.match(draft, /ON UPDATE RESTRICT/);
  assert.match(draft, /UNIQUE \(delivery_id, lesson_id, sequence\)/);
  assert.match(draft, /CREATE UNIQUE INDEX db05_delivery_order_lesson_sequence_uq/);
  assert.doesNotMatch(draft, /UNIQUE\s*\(\s*delivery_id\s*,\s*sequence\s*\)/);
});

test("DB05 delivery reorder writer includes witnessed lesson ID in inserted rows", () => {
  assert.match(writer, /lessonId: input\.lessonId/);
  assert.match(writer, /lessonContentId,\s*lessonId: input\.lessonId,\s*deliveryId:/);
  assert.match(writer, /where id = \$\{input\.deliveryId\} for update/);
  assert.match(writer, /provided\.has\(id\)/);
  assert.match(writer, /\.delete\(\s*lessonContentDeliverySequences/);
  assert.match(reader, /DB05_CONTENT_ORDER_READY/);
  assert.match(reader, /DB05_VERIFIED/);
});

test("DB05 new uniqueness companion does not silently replace tenant guard", () => {
  assert.match(draft, /UNREGISTERED companion/);
  assert.match(draft, /W01 folds exactly once/);
  assert.doesNotMatch(draft, /CREATE TABLE\s+lesson_content_delivery_sequences/i);
  assert.doesNotMatch(draft, /CREATE TRIGGER/i);
  assert.match(other, /db05_content_delivery_order_scope_guard/);
  for (const term of [
    "content_offering_id",
    "target_delivery_offering_id",
    "target_section_college_id",
    "offering_cohort_id",
    "offering_period_id",
  ]) assert.ok(other.includes(term), term);
});

test("DB05 order uniqueness remains source-only until real PostgreSQL and app proof", () => {
  for (const proof of [
    "Different lessons within one delivery",
    "Same lesson/delivery duplicate position",
    "Wrong lesson supplied on raw INSERT/UPDATE",
    "two-connection",
    "upstream course/lesson/offering",
  ]) assert.ok(draft.includes(proof), proof);
  assert.match(draft, /UNREGISTERED, NOT EXECUTED/);
});
