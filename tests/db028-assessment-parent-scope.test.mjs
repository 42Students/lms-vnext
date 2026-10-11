import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync("docs/planning/sql/db06-assessment-parent-scope-candidate.sql", "utf8");
const assessments = fs.readFileSync("src/db/schema/assessments.ts", "utf8");
const quizzes = fs.readFileSync("src/db/schema/quizzes.ts", "utf8");
const courses = fs.readFileSync("src/db/schema/courses.ts", "utf8");
const academics = fs.readFileSync("src/db/schema/academics.ts", "utf8");

function fn(name) {
  const prefix = "CREATE FUNCTION " + name;
  const start = sql.indexOf(prefix);
  assert.ok(start >= 0, "Missing function " + name);
  const next = sql.indexOf("CREATE TRIGGER ", start);
  assert.ok(next > start, "Missing trigger after " + name);
  return sql.slice(start, next);
}

test("DB028 is clearly a staging draft, not a verified migration", () => {
  assert.match(sql.slice(0,400), /CANDIDATE \(NOT REGISTERED\)/);
  assert.match(sql, /Do not apply by itself/);
  assert.equal((sql.match(/^CREATE FUNCTION /gm) || []).length, 5);
  assert.equal((sql.match(/^CREATE TRIGGER /gm) || []).length, 5);
});

test("DB028 assessment definitions preserve lesson-to-delivery offering scope", () => {
  const guard = fn("db28_guard_assessment_definition");
  for (const name of ["course_lessons","course_learning_paths","course_section_deliveries"]) {
    assert.ok(courses.includes('"' + name + '"'), "Source missing " + name);
    assert.ok(guard.includes(name), "Draft missing " + name);
  }
  assert.match(assessments, /"course_assignments"/);
  assert.match(quizzes, /"course_quizzes"/);
  assert.match(guard, /delivery_offering IS DISTINCT FROM lesson_offering/);
  assert.match(guard, /Quiz with attempts cannot change lesson\/delivery/);
  assert.match(guard, /Assignment with submissions cannot change lesson\/delivery/);
});

test("DB028 quiz attempts check quiz origin, fixed delivery and learner scope", () => {
  const guard = fn("db28_guard_quiz_attempt_parent");
  assert.match(quizzes, /"quiz_attempts"/);
  assert.match(guard, /attempt_offering IS DISTINCT FROM source_offering/);
  assert.match(guard, /fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW\.delivery_id/);
  assert.match(guard, /PERFORM db28_guard_learner_delivery/);
});

test("DB028 learner delivery checks active college, role, user and exact section", () => {
  const guard = fn("db28_guard_learner_delivery");
  for (const name of ["college_memberships", "membership_roles", "users",
                      "section_enrollments", "learner_program_enrollments"]) {
    assert.ok(guard.includes(name), "Missing SQL parent: " + name);
  }
  assert.match(guard, /u\.platform_status = 'ACTIVE'/);
  assert.match(guard, /m\.status = 'ACTIVE'/);
  assert.match(guard, /role\.role = 'LEARNER'/);
  assert.match(guard, /se\.section_id = delivery_section/);
  assert.match(guard, /se\.status = 'ACTIVE'/);
  assert.match(guard, /le\.status = 'ACTIVE'/);
  assert.match(guard, /learner_college IS DISTINCT FROM section_college/);
  assert.match(academics, /"section_enrollments"/);
});

test("DB028 assignment submissions require origin offering and bounded grade", () => {
  const guard = fn("db28_guard_assignment_submission_parent");
  assert.match(assessments, /"assignment_submissions"/);
  assert.match(guard, /submission_offering IS DISTINCT FROM source_offering/);
  assert.match(guard, /NEW\.points_awarded > max_points/);
  assert.match(guard, /NEW\.membership_id IS DISTINCT FROM OLD\.membership_id/);
  assert.match(guard, /IF TG_OP = 'INSERT'/);
  assert.match(guard, /PERFORM db28_guard_learner_delivery/);
});

test("DB028 quiz answer question must belong to its attempt's quiz", () => {
  const guard = fn("db28_guard_quiz_answer_parent");
  assert.match(quizzes, /"quiz_attempt_answers"/);
  assert.match(guard, /quiz_attempts a/);
  assert.match(guard, /quiz_questions q/);
  assert.match(guard, /q\.quiz_id = a\.quiz_id/);
  assert.match(guard, /NEW\.attempt_id/);
  assert.match(guard, /NEW\.question_id/);
});

test("DB028 explicitly requires independent migration and PostgreSQL race testing", () => {
  assert.match(sql, /migration \+ snapshot/);
  assert.match(sql, /concurrent/);
  assert.match(sql, /disposable PostgreSQL/);
});
