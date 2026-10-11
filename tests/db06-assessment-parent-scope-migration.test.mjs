import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "drizzle/0041_db06_assessment_parent_scope.sql",
  "utf8",
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);
const previous = JSON.parse(
  fs.readFileSync("drizzle/meta/0040_snapshot.json", "utf8"),
);
const snapshot = JSON.parse(
  fs.readFileSync("drizzle/meta/0041_snapshot.json", "utf8"),
);

test("DB06 assessment guard migration is registered as trigger-only 0041", () => {
  const last = journal.entries.at(-1);
  assert.equal(last.idx, 41);
  assert.equal(last.tag, "0041_db06_assessment_parent_scope");
  assert.equal(snapshot.prevId, previous.id);
  assert.notEqual(snapshot.id, previous.id);

  const normalize = ({ id, prevId, ...rest }) => rest;
  assert.deepEqual(normalize(snapshot), normalize(previous));
});

test("DB06 migration fails closed on poisoned relational history before installing guards", () => {
  assert.match(migration, /DO \$db06_preflight\$/);
  for (const message of [
    "quiz lesson/delivery offering mismatch",
    "assignment lesson/delivery offering mismatch",
    "quiz attempt parent mismatch",
    "assignment submission parent/grade mismatch",
    "quiz answer question mismatch",
  ]) {
    assert.ok(migration.includes(message), message);
  }
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(migration, /\bDROP\s+TABLE\b/i);
});

test("DB06 child writes serialize with mutable parent and enrollment rows", () => {
  for (const token of [
    "FOR SHARE OF l, lp, o",
    "FOR SHARE OF q, l, lp, o",
    "FOR SHARE OF a, l, lp, o",
    "FOR SHARE OF d",
    "FOR SHARE OF m, role, u",
    "FOR SHARE OF se, le",
    "FOR SHARE OF q, l, lp",
    "FOR SHARE OF a, l, lp",
    "FOR SHARE OF a, q",
  ]) {
    assert.ok(migration.includes(token), token);
  }
});

test("DB06 same-offering and exact-delivery guards cover quiz and assignment history", () => {
  for (const trigger of [
    "db06_course_quiz_parent_guard",
    "db06_course_assignment_parent_guard",
    "db06_quiz_attempt_parent_guard",
    "db06_assignment_submission_parent_guard",
    "db06_quiz_answer_parent_guard",
  ]) {
    assert.match(migration, new RegExp(`CREATE TRIGGER ${trigger}`));
  }
  assert.match(
    migration,
    /fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW\.delivery_id/,
  );
  assert.match(
    migration,
    /learner_college IS DISTINCT FROM section_college/,
  );
  assert.match(
    migration,
    /offering_cohort IS DISTINCT FROM section_cohort/,
  );
  assert.match(
    migration,
    /offering_period IS DISTINCT FROM section_period/,
  );
  assert.match(
    migration,
    /offering_college IS DISTINCT FROM section_college/,
  );
  assert.match(
    migration,
    /Assessment delivery offering\/section scope mismatch/,
  );
  assert.match(
    migration,
    /NEW\.points_awarded > max_points/,
  );
});

test("DB06 grade-only corrections do not require a newly active learner enrollment", () => {
  const start = migration.indexOf(
    "CREATE FUNCTION db06_guard_assignment_submission_parent",
  );
  const end = migration.indexOf(
    "CREATE TRIGGER db06_assignment_submission_parent_guard",
    start,
  );
  const guard = migration.slice(start, end);
  assert.match(guard, /Historical grading corrections are allowed/);
  assert.match(
    guard,
    /IF TG_OP = 'INSERT'[\s\S]*NEW\.assignment_id IS DISTINCT FROM OLD\.assignment_id[\s\S]*NEW\.delivery_id IS DISTINCT FROM OLD\.delivery_id[\s\S]*NEW\.membership_id IS DISTINCT FROM OLD\.membership_id/,
  );
  assert.doesNotMatch(
    guard,
    /NEW\.points_awarded IS DISTINCT FROM OLD\.points_awarded[\s\S]*db06_guard_learner_delivery/,
  );
});

test("DB06 freezes parent identity once assessment history would be reinterpreted", () => {
  for (const trigger of [
    "db06_lesson_assessment_reparent_guard",
    "db06_learning_path_assessment_reparent_guard",
    "db06_quiz_question_reparent_guard",
    "db06_delivery_assessment_history_guard",
    "db06_section_assessment_history_guard",
    "db06_offering_assessment_history_guard",
  ]) {
    assert.match(migration, new RegExp(`CREATE TRIGGER ${trigger}`));
  }
  assert.match(
    migration,
    /Question cannot move between quizzes after attempt history exists/,
  );
  assert.match(
    migration,
    /Delivery with assessment history requires controlled transfer/,
  );
});
