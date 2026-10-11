import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const upstream = read("scripts/sql/db05-content-order-upstream-reparent.draft.sql");
const child = read("scripts/sql/db05-content-delivery-order-scope.draft.sql");
const unique = read("scripts/sql/db05-content-delivery-order-unique.draft.sql");
const orderWriter = read("src/modules/courses/lesson-content-order-service.ts");
const readiness = read("src/modules/courses/lesson-content-order-readiness.ts");

test("ancestor and child scope checks share transaction-scoped lock and isolation requirement", () => {
  for (const sql of [upstream, child]) {
    assert.match(sql, /current_setting\('transaction_isolation'\) <> 'read committed'/);
    assert.match(sql, /pg_advisory_xact_lock\(605008003::bigint\)/);
    assert.match(sql, /USING ERRCODE = '25001'/);
  }
  assert.match(child, /db05_content_delivery_order_scope_guard/);
  assert.match(upstream, /db05_content_order_upstream_reparent_guard/);
});

test("upstream candidate prohibits reparenting all six directly involved ancestors", () => {
  const triggers = [
    ["lesson_contents", "lesson_id, delivery_id, status"],
    ["course_lessons", "learning_path_id"],
    ["course_learning_paths", "offering_id"],
    ["course_section_deliveries", "offering_id, section_id"],
    ["course_offerings", "course_id, cohort_id, academic_period_id"],
    ["sections", "cohort_id, academic_period_id"],
  ];
  for (const [table, fields] of triggers) {
    assert.ok(
      upstream.includes(`BEFORE UPDATE OF ${fields}\nON ${table}`),
      `missing ${table} upstream guard`,
    );
    assert.ok(upstream.includes(`TG_TABLE_NAME = '${table}'`), table);
  }
  assert.match(upstream, /has_order_rows/);
  assert.match(upstream, /USING ERRCODE = '23514'/);
  assert.match(upstream, /NEW\.[a-z_]+ IS DISTINCT FROM OLD\.[a-z_]+/);
});

test("upstream checks inspect existing order rows, not merely the parent FK", () => {
  assert.match(upstream, /FROM lesson_content_delivery_sequences order_row/);
  assert.match(upstream, /JOIN lesson_content_delivery_sequences order_row/);
  assert.match(upstream, /WHERE order_row\.lesson_content_id = OLD\.id/);
  assert.match(upstream, /WHERE order_row\.delivery_id = OLD\.id/);
  assert.match(upstream, /WHERE delivery\.section_id = OLD\.id/);
  assert.match(upstream, /WHERE path\.offering_id = OLD\.id/);
  assert.match(unique, /FOREIGN KEY \(lesson_content_id, lesson_id\)/);
});

test("reorder remains complete-set + delivery-locked and disabled until verification", () => {
  assert.match(orderWriter, /for update/);
  assert.match(orderWriter, /\.delete\(\s*lessonContentDeliverySequences/);
  assert.match(orderWriter, /\.insert\(\s*lessonContentDeliverySequences/);
  assert.match(readiness, /DB05_CONTENT_ORDER_READY/);
  assert.match(readiness, /DB05_VERIFIED/);
});

test("candidate is unregistered and explicitly does not overclaim upstream closure", () => {
  assert.match(upstream, /UNREGISTERED COMPANION ONLY/);
  assert.match(upstream, /No PostgreSQL or race acceptance has been run/);
  assert.match(upstream, /academic_periods\.college_id/);
  assert.match(upstream, /department/);
  assert.match(upstream, /DELETE CASCADE/);
  assert.doesNotMatch(upstream, /CREATE TABLE lesson_content_delivery_sequences/i);
});
