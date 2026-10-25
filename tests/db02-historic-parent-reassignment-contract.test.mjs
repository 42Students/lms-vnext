import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// All assertions are source/static and MUST NOT be called PostgreSQL acceptance.
// History guards have been consolidated into canonical DB02 staging.
const draft = readFileSync(new URL(
  "../scripts/sql/db02-academic-progression-and-rooms-staging.sql",
  import.meta.url,
), "utf8").replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
const acceptance = readFileSync(new URL(
  "../scripts/sql/db02-historic-parent-reassignment-acceptance-unregistered.sql",
  import.meta.url,
), "utf8").replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
const base = readFileSync(new URL(
  "../scripts/sql/db02-academic-progression-and-rooms-staging.sql",
  import.meta.url,
), "utf8");
const extension = base;

test("consolidated SQL retains all seven history-parent functions and paired bodies", () => {
  const all = [...draft.matchAll(/CREATE (?:OR REPLACE )?FUNCTION (db02_[a-z_]+)\(\)/g)].map(m => m[1]);
  for (const name of [
    "db02_guard_historic_offering_parent",
    "db02_guard_historic_delivery_parent",
    "db02_guard_historic_event_section",
    "db02_lock_offering_for_delivery",
    "db02_lock_delivery_for_teaching",
    "db02_lock_event_delivery_for_course_link",
    "db02_lock_event_for_attendance_history",
  ]) assert.ok(all.includes(name), "missing history guard " + name);
  assert.equal([...draft.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length, all.length);
  assert.equal([...draft.matchAll(/\$\$/g)].length, all.length * 2);
});

test("consolidated SQL has unique history trigger names", () => {
  const names = [...draft.matchAll(/CREATE TRIGGER (db02_[a-z_]+)/g)].map(m => m[1]);
  assert.equal(new Set(names).size, names.length);
  for (const name of [
    "db02_historic_offering_parent_guard",
    "db02_historic_delivery_parent_guard",
    "db02_historic_event_section_guard",
    "db02_delivery_parent_serialization",
    "db02_teaching_delivery_serialization",
    "db02_event_course_parent_serialization",
    "db02_attendance_session_event_serialization",
    "db02_attendance_record_event_serialization",
  ]) assert.ok(names.includes(name), "missing historic trigger " + name);
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
