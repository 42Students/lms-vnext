import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// All assertions are source/static and MUST NOT be called PostgreSQL acceptance.
const draft = readFileSync(new URL(
  "../scripts/sql/db02-historic-parent-reassignment-guards.draft.sql",
  import.meta.url,
), "utf8");
const acceptance = readFileSync(new URL(
  "../scripts/sql/db02-historic-parent-reassignment-acceptance-unregistered.sql",
  import.meta.url,
), "utf8");
const base = readFileSync(new URL(
  "../scripts/sql/db02-academic-progression-and-rooms-staging.sql",
  import.meta.url,
), "utf8");
const extension = readFileSync(new URL(
  "../scripts/sql/db02-academic-parent-enrollment-tenant-guards.draft.sql",
  import.meta.url,
), "utf8");

test("all seven history-parent guards have paired PL/pgSQL bodies", () => {
  assert.equal([...draft.matchAll(/CREATE FUNCTION db02_[a-z_]+\(\)/g)].length, 7);
  assert.equal([...draft.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length, 7);
  assert.equal([...draft.matchAll(/\$\$/g)].length, 14);
  assert.equal([...draft.matchAll(/CREATE TRIGGER db02_[a-z_]+/g)].length, 8);
});

test("new history-parent triggers do not collide with earlier DB02 drafts", () => {
  const names = (sql) => [...sql.matchAll(/CREATE TRIGGER (db02_[a-z_]+)/g)]
    .map((m) => m[1]);
  const existing = new Set([...names(base), ...names(extension)]);
  for (const name of names(draft)) {
    assert.ok(!existing.has(name), "duplicate trigger: " + name);
  }
});

test("a linked course offering has immutable historical curriculum identity", () => {
  assert.match(draft, /NEW\.program_term_id/);
  assert.match(draft, /OLD\.academic_period_id/);
  assert.match(draft, /EXISTS \(\s*SELECT 1 FROM course_section_deliveries d/);
  assert.match(draft, /BEFORE UPDATE OF cohort_id, academic_period_id, course_id, program_term_id/);
});

test("a linked delivery cannot switch section or offering after historical use", () => {
  assert.match(draft, /FROM course_teaching_assignments t WHERE t\.delivery_id = OLD\.id/);
  assert.match(draft, /FROM section_schedule_event_courses ec WHERE ec\.delivery_id = OLD\.id/);
  assert.match(draft, /BEFORE UPDATE OF offering_id, section_id\s+ON course_section_deliveries/);
});

test("attendance and linked delivery protect scheduled event section", () => {
  for (const table of [
    "section_schedule_event_courses",
    "attendance_sessions",
    "attendance_records",
  ]) {
    assert.ok(draft.includes("FROM " + table), "history dependency: " + table);
  }
  assert.match(draft, /BEFORE UPDATE OF section_id ON section_schedule_events/);
});

test("history writer locks conflict with non-key parent updates", () => {
  for (const name of [
    "db02_delivery_parent_serialization",
    "db02_teaching_delivery_serialization",
    "db02_event_course_parent_serialization",
    "db02_attendance_session_event_serialization",
    "db02_attendance_record_event_serialization",
  ]) assert.ok(draft.includes("CREATE TRIGGER " + name), "writer lock: " + name);
  assert.ok([...draft.matchAll(/FOR SHARE/g)].length >= 5);
});

test("rollback-only acceptance checks same-tenant valid-attempt historical rewrites", () => {
  assert.match(acceptance, /^BEGIN;/m);
  assert.match(acceptance, /^ROLLBACK;/m);
  for (const snippet of [
    "History-backed offering course identity was rewritten",
    "Historical delivery section identity was rewritten",
    "Delivery-linked event section identity was rewritten",
    "Attendance-linked event section identity was rewritten",
  ]) assert.ok(acceptance.includes(snippet), "missing negative: " + snippet);
});
