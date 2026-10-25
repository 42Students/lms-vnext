import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Static safety net for the single canonical UNREGISTERED DB02 proposal.
// These checks are NOT PostgreSQL replay/runtime evidence.
const canonical = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");

function functionNames(sql) {
  return [...sql.matchAll(/\bCREATE (?:OR REPLACE )?FUNCTION ([\w]+)\s*\(/g)].map((m) => m[1]);
}

function triggerNames(sql) {
  return [...sql.matchAll(/\bCREATE TRIGGER ([\w]+)/g)].map((m) => m[1]);
}

test("canonical DB02 has paired PL/pgSQL bodies and unique functions/triggers", () => {
  const functions = functionNames(canonical);
  const triggers = triggerNames(canonical);
  const opens = [...canonical.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length;
  const doubles = [...canonical.matchAll(/\$\$/g)].length;

  assert.ok(functions.length >= 40, "Expected consolidated DB02 guards");
  assert.equal(opens, functions.length);
  assert.equal(doubles, functions.length * 2);
  assert.deepEqual(
    functions.filter((name, index) => functions.indexOf(name) !== index),
    [],
  );
  assert.deepEqual(
    triggers.filter((name, index) => triggers.indexOf(name) !== index),
    [],
  );
  assert.doesNotMatch(canonical, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
});

test("canonical DB02 owns all academic tenant roots and parent identity", () => {
  for (const trigger of [
    "db02_department_college_immutable",
    "db02_academic_period_college_immutable",
    "db02_membership_college_immutable",
    "db02_lecture_hall_college_immutable",
    "db02_program_department_move_guard",
    "db02_course_department_move_guard",
    "db02_cohort_program_immutable",
    "db02_program_term_identity_immutable",
  ]) {
    assert.match(canonical, new RegExp("CREATE TRIGGER " + trigger));
  }
  assert.match(canonical, /NEW\.program_id IS DISTINCT FROM OLD\.program_id/);
  assert.match(canonical, /NEW\.start_period_id IS DISTINCT FROM OLD\.start_period_id/);
  assert.match(canonical, /NEW\.term_number IS DISTINCT FROM OLD\.term_number/);
});

test("section history forbids unsafe structural reparenting and serializes new history", () => {
  assert.match(canonical, /db02_section_history_reparent_guard/);
  for (const table of [
    "section_enrollments",
    "section_faculty_assignments",
    "course_section_deliveries",
    "section_schedule_events",
  ]) {
    assert.match(canonical, new RegExp("EXISTS \\(SELECT 1 FROM " + table));
  }
  assert.match(canonical, /CREATE FUNCTION db02_lock_section_history_parent\(\)/);
  assert.match(canonical, /FROM sections[\s\S]*FOR SHARE/);
  for (const trigger of [
    "db02_lock_section_for_learner_enrollment",
    "db02_lock_section_for_faculty_assignment",
    "db02_lock_section_for_course_delivery",
    "db02_lock_section_for_schedule_event",
  ]) {
    assert.match(canonical, new RegExp("CREATE TRIGGER " + trigger));
  }
});

test("learner program enrollment enforces tenant, role, and active parent lifecycle", () => {
  assert.match(canonical, /db02_learner_program_enrollment_tenant/);
  assert.match(canonical, /role = 'LEARNER'/);
  assert.match(canonical, /membership_college <> program_college/);
  assert.match(canonical, /cohort_program <> NEW\.program_id/);
  assert.match(canonical, /program_status_value IS DISTINCT FROM 'ACTIVE'/);
  assert.match(canonical, /cohort_status_value NOT IN \('PLANNED','ACTIVE'\)/);
  assert.match(canonical, /FOR SHARE OF p/);
  assert.match(canonical, /FROM cohorts[\s\S]*FOR SHARE/);
});

test("section enrollment matches cohort/period and requires active parents", () => {
  assert.match(canonical, /db02_section_enrollment_cohort_period/);
  assert.match(canonical, /learner_cohort <> target_cohort/);
  assert.match(canonical, /NEW\.academic_period_id <> target_period/);
  assert.match(canonical, /learner_status_value IS DISTINCT FROM 'ACTIVE'/);
  assert.match(canonical, /target_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(canonical, /period_status_value = 'CLOSED'/);
  assert.match(canonical, /FROM learner_program_enrollments[\s\S]*FOR SHARE/);
  assert.match(canonical, /FROM sections[\s\S]*FOR SHARE/);
});

test("learner and section enrollment parent identity is immutable", () => {
  assert.match(canonical, /db02_guard_learner_program_enrollment_identity_immutable/);
  assert.match(canonical, /db02_academic_enrollment_identity_immutable/);
  assert.match(canonical, /db02_guard_section_enrollment_identity_immutable/);
  assert.match(canonical, /db02_section_enrollment_identity_immutable/);
});

test("learner identity lifecycle preserves suspension but closes role/end state", () => {
  assert.match(canonical, /db02_withdraw_learner_on_role_delete/);
  assert.match(canonical, /db02_withdraw_learner_on_membership_end/);
  assert.match(canonical, /OLD\.role <> 'LEARNER'/);
  assert.match(canonical, /OLD\.status = 'ENDED' OR NEW\.status <> 'ENDED'/);
  assert.match(canonical, /UPDATE section_enrollments se[\s\S]*status = 'WITHDRAWN'/);
  assert.match(canonical, /UPDATE learner_program_enrollments[\s\S]*withdrawn_at = COALESCE/);
  assert.doesNotMatch(
    canonical,
    /NEW\.status = 'SUSPENDED'[\s\S]{0,300}status = 'WITHDRAWN'/,
  );
});

test("delivery and faculty chains remain scoped and cannot reactivate under inactive parents", () => {
  assert.match(canonical, /db02_course_section_delivery_scope_guard/);
  assert.match(canonical, /offering and section must share cohort and academic period/);
  assert.match(canonical, /Active course delivery requires ACTIVE offering, course and section/);
  assert.match(canonical, /BEFORE INSERT OR UPDATE OF offering_id, section_id, ended_at/);
  assert.match(canonical, /db02_schedule_event_delivery_scope_guard/);
  assert.match(canonical, /delivery must belong to the same section/);
  assert.match(canonical, /Active teaching assignment requires active delivery chain and membership/);
  assert.match(canonical, /Active section faculty assignment requires ACTIVE section and membership/);
  assert.match(canonical, /Active faculty-course association requires ACTIVE membership and course/);
  assert.match(canonical, /Cannot reactivate faculty-course association for archived course/);
  assert.match(canonical, /Cannot reactivate faculty assignment for archived section/);
  assert.match(canonical, /Cannot reactivate teaching assignment without active delivery chain/);
});

test("historic parent identity freezes after dependent history exists", () => {
  assert.match(canonical, /db02_historic_offering_parent_guard/);
  assert.match(canonical, /Offering academic identity cannot change after delivery exists/);
  assert.match(canonical, /db02_historic_delivery_parent_guard/);
  assert.match(canonical, /Course delivery identity cannot change after teaching or event history/);
  assert.match(canonical, /db02_historic_event_section_guard/);
  assert.match(canonical, /Schedule event cannot move section after delivery\/attendance history/);
});

test("historic parent insertion locks close reparent races", () => {
  for (const trigger of [
    "db02_delivery_parent_serialization",
    "db02_teaching_delivery_serialization",
    "db02_event_course_parent_serialization",
    "db02_attendance_session_event_serialization",
    "db02_attendance_record_event_serialization",
  ]) {
    assert.match(canonical, new RegExp("CREATE TRIGGER " + trigger));
  }
  assert.match(canonical, /FROM course_offerings WHERE id = NEW\.offering_id FOR SHARE/);
  assert.match(canonical, /FROM course_section_deliveries WHERE id = NEW\.delivery_id FOR SHARE/);
  assert.match(canonical, /FROM section_schedule_events WHERE id = NEW\.schedule_event_id FOR SHARE/);
});

test("canonical DB02 preserves reversible cohort INACTIVE idempotently and retains zero-credit offerings", () => {
  assert.match(canonical, /ALTER TYPE cohort_status ADD VALUE IF NOT EXISTS 'INACTIVE' BEFORE 'COMPLETED'/);
  assert.doesNotMatch(canonical, /ALTER TYPE cohort_status RENAME TO/);
  assert.doesNotMatch(canonical, /DROP TYPE cohort_status/);
  assert.match(canonical, /db02_guard_cohort_status_lifecycle/);
  assert.match(canonical, /db02_course_offerings_credits_ck/);
  assert.match(canonical, /credits IS NULL OR credits BETWEEN 0 AND 30/);
});

test("scheduled events and learner reactivation re-check active parent lifecycle", () => {
  assert.match(canonical, /Scheduled event requires an ACTIVE section/);
  assert.match(
    canonical,
    /BEFORE INSERT OR UPDATE OF section_id, faculty_membership_id, lecture_hall_id, status, starts_at, ends_at/,
  );
  assert.match(canonical, /Cannot reactivate learner program under inactive program\/cohort/);
  assert.match(canonical, /Cannot reactivate section enrollment under inactive section\/closed period/);
});
