import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// UNREGISTERED DB02 staging: static assertions only, NOT executed PG verification.
const base = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
const acceptance = readFileSync(
  new URL("../scripts/sql/db02-activation-role-lifecycle-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

test("faculty reactivation checks live ACTIVE membership", () => {
  assert.match(base, /CREATE FUNCTION db02_guard_faculty_assignment_reactivation\(\)/);
  assert.match(base, /OLD\.ended_at IS NULL OR NEW\.ended_at IS NOT NULL/);
  assert.match(base, /v_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(base, /Cannot reactivate faculty assignment without ACTIVE membership/);
  assert.match(base, /Cannot reactivate faculty assignment without FACULTY role/);
});

test("faculty ended_at-only update checked on all three association surfaces", () => {
  for (const [name, table] of [
    ["db02_course_pool_reactivation_role_guard", "faculty_course_associations"],
    ["db02_section_faculty_reactivation_role_guard", "section_faculty_assignments"],
    ["db02_teaching_reactivation_role_guard", "course_teaching_assignments"],
  ]) {
    const regex = new RegExp(
      "CREATE TRIGGER " + name +
      "\\s+BEFORE UPDATE OF ended_at ON " + table +
      "\\s+FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation\\(\\)",
    );
    assert.match(base, regex, name);
  }
});

test("faculty cleanup stays valid after role/member end", () => {
  assert.match(base, /CREATE FUNCTION db02_end_faculty_course_associations_on_role_removal\(\)/);
  assert.match(base, /CREATE FUNCTION db02_end_faculty_course_associations_on_membership_inactive\(\)/);
  assert.match(base, /IF OLD\.ended_at IS NULL OR NEW\.ended_at IS NOT NULL THEN[\s\S]*?RETURN NEW/);
  assert.match(base, /SET ended_at = COALESCE\(ended_at, now\(\)\)/);
});

test("program enrollment only reactivates with current LEARNER role and membership", () => {
  assert.match(base, /CREATE FUNCTION db02_guard_learner_program_reactivation\(\)/);
  assert.match(base, /CREATE TRIGGER db02_program_enrollment_reactivation_role_guard/);
  assert.match(base, /BEFORE UPDATE OF status ON learner_program_enrollments/);
  assert.match(base, /Cannot reactivate learner program without ACTIVE membership/);
  assert.match(base, /Cannot reactivate learner program without LEARNER role/);
});

test("section reactivation locks parent learner enrollment and its live role", () => {
  assert.match(base, /CREATE FUNCTION db02_guard_learner_section_reactivation\(\)/);
  assert.match(base, /BEFORE UPDATE OF status ON section_enrollments/);
  assert.match(base, /learner_program_enrollments WHERE id = NEW\.learner_enrollment_id\s+FOR SHARE/);
  assert.match(base, /Cannot reactivate section without ACTIVE learner program/);
  assert.match(base, /Cannot reactivate section without ACTIVE college membership/);
  assert.match(base, /Cannot reactivate section without LEARNER role/);
});

test("parent exit closes active section enrollment with correct lifecycle meaning", () => {
  assert.match(base, /CREATE FUNCTION db02_close_active_sections_on_program_exit\(\)/);
  assert.match(base, /CREATE TRIGGER db02_program_exit_close_active_sections/);
  assert.match(base, /AFTER UPDATE OF status ON learner_program_enrollments/);
  assert.match(base, /NEW\.status = 'COMPLETED' THEN 'COMPLETED'::section_enrollment_status/);
  assert.match(base, /ELSE 'WITHDRAWN'::section_enrollment_status/);
  assert.match(base, /WHERE learner_enrollment_id = NEW\.id AND status = 'ACTIVE'/);
});

test("role and membership rows are FOR SHARE locked against revocation", () => {
  const start = base.indexOf("CREATE FUNCTION db02_guard_faculty_assignment_reactivation()");
  assert.ok(start >= 0);
  const part = base.slice(start);
  assert.match(part, /FROM college_memberships[\s\S]*?FOR SHARE/);
  assert.match(part, /FROM membership_roles[\s\S]*?FOR SHARE/);
});

test("PG acceptance covers denied resurrection, positive role restore and parent exit", () => {
  for (const expected of [
    "revoked FACULTY reopened course pool",
    "revoked FACULTY reopened section assignment",
    "revoked FACULTY reopened teaching assignment",
    "ENDED membership reopened section faculty assignment",
    "revoked LEARNER reopened program",
    "revoked LEARNER reopened section",
    "Completed program left live/withdrawn section history",
    "Withdrawn program left live section history",
    "DB02 activation role lifecycle PASS",
  ]) assert.ok(acceptance.includes(expected), expected);
  assert.match(acceptance, /^BEGIN;/m);
  assert.match(acceptance, /^ROLLBACK;/m);
});

test("two-session faculty reactivation races guard both commit orders", () => {
  const races = readFileSync(
    new URL("../scripts/sql/db02-role-reactivation-concurrency-unregistered.sh", import.meta.url),
    "utf8",
  );
  assert.match(races, /DB02_DISPOSABLE_ACCEPTANCE:-/);
  assert.match(races, /DB02_EXPECTED_DATABASE/);
  assert.match(races, /SELECT current_database\(\)/);
  assert.match(races, /role-delete-first: reopened faculty course rejected/);
  assert.match(races, /reactivation-first: subsequent role deletion closed faculty relationship/);
  assert.match(races, /Cannot reactivate faculty assignment without FACULTY role/);
  assert.match(races, /STATE_A/);
  assert.match(races, /STATE_B/);
  assert.match(races, /CLOSED:0/);
});
