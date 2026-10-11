import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Static safety net for UNREGISTERED DB02 proposals.
// These checks are NOT PostgreSQL replay/runtime evidence.
const canonical = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
);
const extension = readFileSync(
  new URL("../scripts/sql/db02-academic-parent-enrollment-tenant-guards.draft.sql", import.meta.url),
  "utf8",
);

function functionNames(sql) {
  return [...sql.matchAll(/\bCREATE FUNCTION ([\w]+)\s*\(/g)].map((m) => m[1]);
}

function triggerNames(sql) {
  return [...sql.matchAll(/\bCREATE TRIGGER ([\w]+)/g)].map((m) => m[1]);
}

test("both DB02 drafts have paired PL/pgSQL bodies", () => {
  for (const [name, sql] of [
    ["canonical", canonical],
    ["extension", extension],
  ]) {
    const fn = functionNames(sql).length;
    const opens = [...sql.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length;
    const doubles = [...sql.matchAll(/\$\$/g)].length;
    assert.ok(fn > 0, name + " must define functions");
    assert.equal(opens, fn, name + " opening delimiter count");
    assert.equal(doubles, fn * 2, name + " total delimiter count");
    assert.doesNotMatch(sql, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
  }
});

test("canonical and extension drafts have zero trigger-name overlap", () => {
  const canonicalTriggers = new Set(triggerNames(canonical));
  const extensionTriggers = triggerNames(extension);
  const overlap = extensionTriggers.filter((name) => canonicalTriggers.has(name));
  assert.deepEqual(overlap, []);
});

test("canonical DB02 owns primary tenant and period scope", () => {
  for (const trigger of [
    "db02_department_college_immutable",
    "db02_program_department_move_guard",
    "db02_course_department_move_guard",
    "db02_cohort_period_scope_guard",
    "db02_section_period_scope_guard",
    "db02_course_offering_period_window_guard",
    "db02_section_faculty_assignment_scope_guard",
    "db02_course_teaching_assignment_scope_guard",
  ]) {
    assert.match(canonical, new RegExp("CREATE TRIGGER " + trigger));
    assert.doesNotMatch(extension, new RegExp("CREATE TRIGGER " + trigger));
  }
});

test("extension owns only remaining college-root immutability", () => {
  for (const trigger of [
    "db02_academic_period_college_immutable",
    "db02_membership_college_immutable",
    "db02_lecture_hall_college_immutable",
  ]) {
    assert.match(extension, new RegExp("CREATE TRIGGER " + trigger));
  }
  assert.doesNotMatch(extension, /CREATE TRIGGER db02_department_college_immutable/);
});

test("cohort and program-term parent identity cannot silently change", () => {
  assert.match(extension, /db02_cohort_program_immutable/);
  assert.match(extension, /NEW\.program_id IS DISTINCT FROM OLD\.program_id/);
  assert.match(extension, /NEW\.start_period_id IS DISTINCT FROM OLD\.start_period_id/);
  assert.match(extension, /db02_program_term_identity_immutable/);
  assert.match(extension, /NEW\.term_number IS DISTINCT FROM OLD\.term_number/);
});

test("section history forbids unsafe structural reparenting", () => {
  assert.match(extension, /db02_section_history_reparent_guard/);
  for (const table of [
    "section_enrollments",
    "section_faculty_assignments",
    "course_section_deliveries",
    "section_schedule_events",
  ]) {
    assert.match(extension, new RegExp("EXISTS \\(SELECT 1 FROM " + table));
  }
});

test("learner program enrollment enforces active LEARNER tenant scope", () => {
  assert.match(extension, /db02_learner_program_enrollment_tenant/);
  assert.match(extension, /status = 'ACTIVE'/);
  assert.match(extension, /role = 'LEARNER'/);
  assert.match(extension, /membership_college <> program_college/);
  assert.match(extension, /cohort_program <> NEW\.program_id/);
  assert.match(extension, /FOR SHARE/);
});

test("section enrollment matches learner cohort and actual section period", () => {
  assert.match(extension, /db02_section_enrollment_cohort_period/);
  assert.match(extension, /learner_cohort <> target_cohort/);
  assert.match(extension, /NEW\.academic_period_id <> target_period/);
});

test("history-producing section references lock parent row", () => {
  assert.match(extension, /CREATE FUNCTION db02_lock_section_history_parent\(\)/);
  assert.match(extension, /FROM sections[\s\S]*FOR SHARE/);
  for (const trigger of [
    "db02_lock_section_for_learner_enrollment",
    "db02_lock_section_for_faculty_assignment",
    "db02_lock_section_for_course_delivery",
    "db02_lock_section_for_schedule_event",
  ]) {
    assert.match(extension, new RegExp("CREATE TRIGGER " + trigger));
  }
});

test("enrollment parent identity is immutable once history exists", () => {
  assert.match(extension, /db02_academic_enrollment_identity_immutable/);
  assert.match(extension, /db02_section_enrollment_identity_immutable/);
  assert.match(extension, /learner program enrollment identity is immutable/);
  assert.match(extension, /section enrollment history identity is immutable/);
});

test("canonical delivery and faculty chains are database scoped", () => {
  assert.match(canonical, /db02_course_section_delivery_scope_guard/);
  assert.match(canonical, /offering and section must share cohort and academic period/);
  assert.match(canonical, /db02_schedule_event_delivery_scope_guard/);
  assert.match(canonical, /delivery must belong to the same section/);
  assert.match(canonical, /Course teaching assignment requires FACULTY role/);
  assert.match(canonical, /Section faculty assignment requires FACULTY role/);
});


test("learner identity lifecycle preserves suspension but closes role/end state", () => {
  assert.match(extension, /CREATE FUNCTION db02_withdraw_learner_academic_state\(\)/);
  assert.match(extension, /OLD\.role = 'LEARNER'/);
  assert.match(extension, /OLD\.status <> 'ENDED' AND NEW\.status = 'ENDED'/);
  assert.match(extension, /UPDATE section_enrollments se[\s\S]*status = 'WITHDRAWN'/);
  assert.match(extension, /UPDATE learner_program_enrollments[\s\S]*withdrawn_at = COALESCE/);
  assert.match(extension, /db02_withdraw_learner_on_role_removal/);
  assert.match(extension, /db02_withdraw_learner_on_membership_end/);
  assert.doesNotMatch(
    extension,
    /should_withdraw := [^;]*SUSPENDED/,
    "temporary suspension must not academically withdraw the learner",
  );
});


test("canonical DB02 preserves reversible cohort INACTIVE and zero-credit offerings", () => {
  assert.match(canonical, /ALTER TYPE cohort_status ADD VALUE IF NOT EXISTS 'INACTIVE'/);
  assert.match(canonical, /db02_course_offerings_credits_ck/);
  assert.match(canonical, /credits IS NULL OR credits BETWEEN 0 AND 30/);
});
