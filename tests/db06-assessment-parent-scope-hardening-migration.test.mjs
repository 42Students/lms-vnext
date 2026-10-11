import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "drizzle/0042_db06_assessment_scope_hardening.sql",
  "utf8",
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);
const previous = JSON.parse(
  fs.readFileSync("drizzle/meta/0041_snapshot.json", "utf8"),
);
const snapshot = JSON.parse(
  fs.readFileSync("drizzle/meta/0042_snapshot.json", "utf8"),
);

test("DB06 hardening is registered as trigger-only 0042", () => {
  const entry = journal.entries.find((item) => item.idx === 42);
  assert.ok(entry);
  assert.equal(entry.tag, "0042_db06_assessment_scope_hardening");
  assert.equal(snapshot.prevId, previous.id);
  assert.notEqual(snapshot.id, previous.id);

  const normalize = ({ id, prevId, ...rest }) => rest;
  assert.deepEqual(normalize(snapshot), normalize(previous));
});

test("DB06 hardening preflight is non-destructive and checks historical learner tenant scope", () => {
  assert.match(migration, /DO \$db06_hardening_preflight\$/);
  assert.match(migration, /historical assessment learner rows cross college scope/);
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(
    migration,
    /\bUPDATE\s+(quiz_attempts|assignment_submissions)\b/i,
  );
});

test("DB06 hardening prevents lowering max points below historical grades", () => {
  assert.match(
    migration,
    /Assignment max points cannot undercut historical grades/,
  );
  assert.match(
    migration,
    /UPDATE OF lesson_id, delivery_id, max_points ON course_assignments/,
  );
});

test("DB06 hardening makes a bound elective roster authoritative", () => {
  for (const token of [
    "elective_offerings",
    "elective_slots",
    "lms_groups",
    "lms_group_members",
    "gm.member_type = 'LEARNER'",
    "gm.state = 'ACTIVE'",
    "Learner is not in the active elective assessment roster",
    "Learner no longer satisfies elective academic eligibility",
  ]) {
    assert.ok(migration.includes(token), token);
  }
  assert.match(migration, /Any elective binding owns access/);
  assert.match(migration, /FOR SHARE OF eo, es, g/);
  assert.match(migration, /delivery_type <> 'ELECTIVE'/);
  assert.match(
    migration,
    /delivery_program IS DISTINCT FROM elective_slot_program/,
  );
});

test("DB06 hardening keeps ordinary section roster exact and locked", () => {
  assert.match(migration, /se\.section_id = delivery_section/);
  assert.match(migration, /se\.academic_period_id = section_period/);
  assert.match(migration, /lpe\.cohort_id = section_cohort/);
  assert.match(migration, /FOR SHARE OF se, lpe/);
  assert.match(migration, /FOR SHARE OF m, role, u/);
});

test("DB06 hardening makes attempt and submission attribution immutable", () => {
  assert.match(migration, /Quiz attempt attribution is immutable/);
  assert.match(migration, /Assignment submission attribution is immutable/);
});

test("DB06 hardening validates newly persisted graders against current service authority", () => {
  for (const token of [
    "u.platform_status = 'ACTIVE'",
    "sr.role = 'SUPER_ADMIN'",
    "mr.role = 'COLLEGE_ADMIN'",
    "mr.role = 'FACULTY'",
    "course_teaching_assignments",
    "ta.ended_at IS NULL",
  ]) {
    assert.ok(migration.includes(token), token);
  }
  assert.match(
    migration,
    /Faculty grader is not actively assigned to this delivery/,
  );
  assert.match(migration, /FOR SHARE/);
});

test("DB06 hardening preserves post-graduation correction and keeps publisher identity gap explicit", () => {
  assert.match(
    migration,
    /Historical corrections remain valid after learner graduation/,
  );
  assert.match(
    migration,
    /Grade publication remains service-authorized/,
  );
  assert.doesNotMatch(
    migration,
    /UPDATE OF[\s\S]{0,180}grade_published/,
  );
});
