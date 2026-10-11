import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Static safety net for an UNREGISTERED proposal. These checks are NOT a
// substitute for a PostgreSQL replay, negative tenant tests, or concurrency.
const sql = readFileSync(
  new URL("../scripts/sql/db02-academic-parent-enrollment-tenant-guards.draft.sql", import.meta.url),
  "utf8",
);

test("all parent and enrollment draft PL/pgSQL bodies are paired", () => {
  const fn = [...sql.matchAll(/\bCREATE FUNCTION db02_[\w]+\s*\(/g)].length;
  const opens = [...sql.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length;
  const doubles = [...sql.matchAll(/\$\$/g)].length;
  assert.ok(fn >= 9);
  assert.equal(fn, opens);
  assert.equal(doubles, fn * 2);
  assert.doesNotMatch(sql, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
});

test("college ownership is immutable across DB02 root records", () => {
  for (const trigger of [
    "db02_department_college_immutable",
    "db02_academic_period_college_immutable",
    "db02_membership_college_immutable",
    "db02_lecture_hall_college_immutable",
  ]) assert.match(sql, new RegExp("CREATE TRIGGER " + trigger));
  assert.match(sql, /NEW\.college_id IS DISTINCT FROM OLD\.college_id/);
});

test("program and course department reassignment only stays in one college", () => {
  assert.match(sql, /db02_program_department_reassignment_scope/);
  assert.match(sql, /db02_course_department_reassignment_scope/);
  assert.match(sql, /old_college <> new_college/);
  assert.match(sql, /NEW\.department_id IS NOT DISTINCT FROM OLD\.department_id/);
});

test("cohort, program term, and learner enrollment identity cannot silently change", () => {
  assert.match(sql, /db02_cohort_program_immutable/);
  assert.match(sql, /NEW\.start_period_id IS DISTINCT FROM OLD\.start_period_id/);
  assert.match(sql, /db02_program_term_identity_immutable/);
  assert.match(sql, /NEW\.term_number IS DISTINCT FROM OLD\.term_number/);
  assert.match(sql, /db02_academic_enrollment_identity_immutable/);
  assert.match(sql, /db02_section_enrollment_identity_immutable/);
});

test("direct SQL cohort and section period relationships enforce college scope", () => {
  assert.match(sql, /db02_cohort_period_tenant/);
  assert.match(sql, /start_college IS DISTINCT FROM owner_college/);
  assert.match(sql, /end_college IS DISTINCT FROM owner_college/);
  assert.match(sql, /db02_section_period_tenant/);
  assert.match(sql, /period_college IS DISTINCT FROM owner_college/);
});

test("direct SQL learner and section enrollment relationships enforce cohort scope", () => {
  assert.match(sql, /db02_learner_program_enrollment_tenant/);
  assert.match(sql, /membership_college <> program_college/);
  assert.match(sql, /cohort_program <> NEW\.program_id/);
  assert.match(sql, /db02_section_enrollment_cohort_period/);
  assert.match(sql, /learner_cohort <> target_cohort/);
  assert.match(sql, /NEW\.academic_period_id <> target_period/);
});

test("existing section history forbids unsafe structural reparenting", () => {
  assert.match(sql, /TG_OP = 'UPDATE' THEN/);
  for (const table of [
    "section_enrollments",
    "section_faculty_assignments",
    "course_section_deliveries",
    "section_schedule_events",
  ]) assert.match(sql, new RegExp("EXISTS \\(SELECT 1 FROM " + table));
});

test("faculty section assignments cannot link to another college", () => {
  assert.match(sql, /db02_section_faculty_assignment_tenant/);
  assert.match(sql, /section_college <> membership_college/);
});

test("history-producing inserts lock section parents against reparent races", () => {
  assert.match(sql, /CREATE FUNCTION db02_lock_section_history_parent\(\)/);
  assert.match(sql, /FROM sections WHERE id = NEW\.section_id FOR SHARE/);
  for (const trigger of [
    "db02_lock_section_for_learner_enrollment",
    "db02_lock_section_for_faculty_assignment",
    "db02_lock_section_for_course_delivery",
    "db02_lock_section_for_schedule_event",
  ]) assert.match(sql, new RegExp("CREATE TRIGGER " + trigger));
});
