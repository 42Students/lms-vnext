import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const candidate = read("../scripts/sql/db05-content-delivery-order-unique-lesson.draft.sql");
const scope = read("../scripts/sql/db05-content-delivery-order-scope.draft.sql");
const base = read("../docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql");
const staged = read("../src/db/schema/lesson-content-order-staged.ts");
const writer = read("../src/modules/courses/lesson-content-order-service.ts");

test("delivery order uniqueness stays a companion, not a duplicate staged table", () => {
  assert.match(candidate, /UNREGISTERED, NOT EXECUTED, W01 INTEGRATION ONLY/);
  assert.match(candidate, /COMPANION to/);
  assert.doesNotMatch(candidate, /CREATE TABLE(?: IF NOT EXISTS)? lesson_content_delivery_sequences/i);
  assert.match(base, /create table if not exists lesson_content_delivery_sequences/);
  assert.match(staged, /primaryKey\(\{ columns: \[table\.lessonContentId, table\.deliveryId\]/);
  assert.match(scope, /ON lesson_content_delivery_sequences/);
});

test("enforces UNIQUE delivery, lesson, sequence without incorrect global sequence uniqueness", () => {
  assert.match(candidate, /CREATE UNIQUE INDEX db05_delivery_order_lesson_sequence_uq/);
  assert.match(candidate, /ON lesson_content_delivery_sequences \(delivery_id, lesson_id, sequence\)/);
  assert.doesNotMatch(candidate, /CREATE UNIQUE INDEX\s+\w+\s+ON lesson_content_delivery_sequences\s*\(delivery_id, sequence\)/);
  assert.match(candidate, /Other lessons can use 0/);
  assert.match(candidate, /composite content\/delivery PK/);
});

test("derives content's trusted lesson id and rejects a mismatched supplied parent", () => {
  assert.match(candidate, /CREATE UNIQUE INDEX db05_lesson_contents_id_lesson_uq/);
  assert.match(candidate, /UPDATE lesson_content_delivery_sequences row/);
  assert.match(candidate, /ALTER COLUMN lesson_id SET NOT NULL/);
  assert.match(candidate, /FOREIGN KEY \(lesson_content_id, lesson_id\)/);
  assert.match(candidate, /REFERENCES lesson_contents \(id, lesson_id\)/);
  assert.match(candidate, /ON UPDATE RESTRICT ON DELETE CASCADE/);
  assert.match(candidate, /NEW\.lesson_id IS DISTINCT FROM actual_lesson_id/);
  assert.match(candidate, /NEW\.lesson_id := actual_lesson_id/);
  assert.match(candidate, /USING ERRCODE = '23514'/);
});

test("writer performs an atomic full per-lesson reorder with delivery lock", () => {
  assert.match(writer, /select id from \$\{courseSectionDeliveries\}[\s\S]*?for update/);
  assert.match(writer, /eq\(\s*lessonContents\.lessonId,\s*input\.lessonId/);
  assert.match(writer, /delete\(\s*lessonContentDeliverySequences/);
  assert.match(writer, /insert\(\s*lessonContentDeliverySequences/);
  assert.match(candidate, /Same lesson\/delivery duplicate position rejects 23505/);
  assert.match(candidate, /Wrong lesson supplied on raw INSERT\/UPDATE rejects 23514/);
});

test("upstream course and lesson reparent safety stays explicitly unverified", () => {
  assert.match(candidate, /Parent lesson_id update with existing overrides rejected/);
  assert.match(candidate, /Clean PostgreSQL replay, rollback, historical duplicates/);
  assert.match(scope, /Upstream changes to lesson\/content delivery/);
  assert.match(candidate, /no one should run against prod|NOT EXECUTED|Do not run this SQL against production/);
});
