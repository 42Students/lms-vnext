import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync(
  "docs/planning/sql/db06-assessment-parent-scope-candidate.sql",
  "utf8",
);
const assessments = fs.readFileSync("src/db/schema/assessments.ts", "utf8");
const quizzes = fs.readFileSync("src/db/schema/quizzes.ts", "utf8");
const courses = fs.readFileSync("src/db/schema/courses.ts", "utf8");
const electives = fs.readFileSync("src/db/schema/electives.ts", "utf8");
const rosterAccess = fs.readFileSync("src/modules/groups/roster-access.ts", "utf8");
const assignmentService = fs.readFileSync(
  "src/modules/courses/assignment-submission-service.ts",
  "utf8",
);
const permissionPolicy = fs.readFileSync(
  "src/modules/permissions/policy.ts",
  "utf8",
);
const db02History = fs.readFileSync(
  "scripts/sql/db02-historic-parent-reassignment-guards.draft.sql",
  "utf8",
);

function fn(name) {
  const markers = [
    "CREATE OR REPLACE FUNCTION " + name,
    "CREATE FUNCTION " + name,
  ];
  const start = markers
    .map((marker) => sql.indexOf(marker))
    .find((index) => index >= 0);
  assert.ok(start >= 0, "Missing function " + name);

  const nextCandidates = [
    sql.indexOf("\nCREATE OR REPLACE FUNCTION ", start + 1),
    sql.indexOf("\nCREATE FUNCTION ", start + 1),
    sql.indexOf("\nCREATE TRIGGER ", start + 1),
    sql.indexOf("\nDO $", start + 1),
  ].filter((index) => index > start);
  const end = nextCandidates.length > 0
    ? Math.min(...nextCandidates)
    : sql.length;
  return sql.slice(start, end);
}

test("DB030 remains one unregistered canonical source candidate with poison preflight", () => {
  assert.match(sql.slice(0, 900), /DB-030 canonical/);
  assert.match(sql.slice(0, 900), /NOT REGISTERED/);
  assert.match(sql, /DO \$db30_preflight\$/);
  assert.match(sql, /never clean data silently/i);
  assert.match(sql, /quiz definitions have lesson\/delivery offering mismatch/);
  assert.match(sql, /assignment submissions have invalid parentage\/grade bounds/);
  assert.match(sql, /quiz answers point at a question from another quiz/);
  assert.match(sql, /historical assessment learner rows cross college scope/);
});

test("DB030 definition guard locks lesson path delivery and prevents reverse reinterpretation", () => {
  const guard = fn("db28_guard_assessment_definition");
  for (const name of [
    "course_lessons",
    "course_learning_paths",
    "course_section_deliveries",
  ]) {
    assert.ok(courses.includes('"' + name + '"'), "Source missing " + name);
    assert.ok(guard.includes(name), "Guard missing " + name);
  }
  assert.match(guard, /FOR SHARE/);
  assert.match(guard, /Assignment max points cannot undercut historical grades/);
  assert.match(sql, /db30_learning_path_assessment_reparent_guard/);
  assert.match(sql, /db30_lesson_assessment_reparent_guard/);
  assert.match(sql, /db30_assessment_delivery_reparent_guard/);
  assert.match(sql, /Assessment-linked delivery cannot change offering\/section/);
});

test("DB030 learner guard follows core-section and group-backed elective access models", () => {
  const guard = fn("db28_guard_learner_delivery");
  for (const name of [
    "college_memberships",
    "membership_roles",
    "users",
    "section_enrollments",
    "learner_program_enrollments",
    "elective_offerings",
    "elective_slots",
    "lms_groups",
    "lms_group_members",
  ]) {
    assert.ok(guard.includes(name), "Missing SQL access parent " + name);
  }
  assert.match(guard, /member_type = 'LEARNER'/);
  assert.match(guard, /gm\.state = 'ACTIVE'/);
  assert.match(guard, /elective_group_status <> 'ACTIVE'/);
  assert.match(guard, /elective_offering_deleted IS NOT NULL/);
  assert.match(guard, /Learner is not in the active elective assessment roster/);
  assert.match(guard, /Learner no longer satisfies elective academic eligibility/);
  assert.match(guard, /se\.section_id = delivery_section/);
  assert.match(guard, /Learner is not actively enrolled in assessment section/);
  assert.match(guard, /FOR SHARE OF m, role, u/);
  assert.match(guard, /FOR SHARE OF se, lpe/);

  assert.match(electives, /"elective_offerings"/);
  assert.match(rosterAccess, /A backed delivery's roster is EXCLUSIVELY the ACTIVE elective group/);
  assert.match(rosterAccess, /hasActiveElectiveDeliveryAccess/);
  assert.match(rosterAccess, /isElectiveBackedDelivery/);
});

test("DB030 quiz attempt attribution is locked and immutable after answer history", () => {
  const guard = fn("db28_guard_quiz_attempt_parent");
  assert.match(quizzes, /"quiz_attempts"/);
  assert.match(guard, /FROM course_quizzes q/);
  assert.match(guard, /FOR SHARE/);
  assert.match(guard, /attempt_offering IS DISTINCT FROM source_offering/);
  assert.match(
    guard,
    /fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW\.delivery_id/,
  );
  assert.match(guard, /Quiz attempt with answers has immutable attribution/);
  assert.match(guard, /PERFORM db28_guard_learner_delivery/);
});

test("DB030 assignment submission keeps parent identity immutable and grade bounded", () => {
  const guard = fn("db28_guard_assignment_submission_parent");
  assert.match(assessments, /"assignment_submissions"/);
  assert.match(guard, /Assignment submission attribution is immutable/);
  assert.match(guard, /submission_offering IS DISTINCT FROM source_offering/);
  assert.match(guard, /NEW\.points_awarded > max_points/);
  assert.match(guard, /IF TG_OP = 'INSERT'/);
  assert.match(guard, /PERFORM db28_guard_learner_delivery/);
  assert.match(sql, /UPDATE OF[\s\S]*points_awarded, feedback,[\s\S]*grading_status/);
});

test("DB030 current grader guard mirrors service admin/faculty authorization", () => {
  const guard = fn("db30_guard_assignment_grader");
  assert.match(guard, /u\.platform_status = 'ACTIVE'/);
  assert.match(guard, /sr\.role = 'SUPER_ADMIN'/);
  assert.match(guard, /mr\.role = 'COLLEGE_ADMIN'/);
  assert.match(guard, /mr\.role = 'FACULTY'/);
  assert.match(guard, /course_teaching_assignments/);
  assert.match(guard, /ta\.ended_at IS NULL/);
  assert.match(guard, /FOR SHARE/);

  assert.match(assignmentService, /requireAssignmentGradeAccess/);
  assert.match(assignmentService, /can\(context, "courses\.manage"/);
  assert.match(assignmentService, /requireDeliveryContentMutation/);
  assert.match(permissionPolicy, /case "courses\.manage":/);
  assert.match(permissionPolicy, /hasMembershipRole\(context, "COLLEGE_ADMIN"\)/);
});

test("DB030 historical grade correction does not require the learner to remain actively enrolled", () => {
  const guard = fn("db28_guard_assignment_submission_parent");
  const learnerCheck = guard.indexOf(
    "PERFORM db28_guard_learner_delivery(NEW.delivery_id, NEW.membership_id)",
  );
  const insertBranch = guard.indexOf("IF TG_OP = 'INSERT' THEN");
  const graderCheck = guard.indexOf("PERFORM db30_guard_assignment_grader");

  assert.ok(insertBranch >= 0);
  assert.ok(learnerCheck > insertBranch);
  assert.ok(graderCheck > learnerCheck);
  assert.doesNotMatch(
    guard.slice(learnerCheck + 1, graderCheck),
    /NEW\.assignment_id IS DISTINCT FROM OLD\.assignment_id/,
  );
  assert.match(
    guard,
    /historical learner may have graduated/i,
  );
});

test("DB030 answer and question locks close both directions of quiz/question parentage", () => {
  const answer = fn("db28_guard_quiz_answer_parent");
  const question = fn("db30_guard_quiz_question_reparent");
  assert.match(quizzes, /"quiz_attempt_answers"/);
  assert.match(answer, /quiz_attempts/);
  assert.match(answer, /quiz_questions/);
  assert.match(answer, /FOR SHARE/);
  assert.match(answer, /question_quiz IS DISTINCT FROM attempt_quiz/);
  assert.match(question, /quiz_attempt_answers/);
  assert.match(question, /Answered quiz question cannot move to another quiz/);
  assert.match(sql, /db30_quiz_question_reparent_guard/);
});

test("DB030 explicitly uses DB02 SHARE serialization and avoids DB05 advisory-lock ownership", () => {
  assert.match(
    db02History,
    /FK KEY SHARE row locks do not conflict with a non-key parent UPDATE/,
  );
  assert.match(db02History, /FOR SHARE/);
  assert.match(sql, /follows DB02's explicit SHARE-vs-NO-KEY-UPDATE serialization model/i);
  assert.match(sql, /DB05's course-parent advisory lock is independent/i);
  assert.doesNotMatch(sql, /pg_advisory_xact_lock/);
});

test("DB030 promotion boundary keeps PostgreSQL, race and grade-publication proof open", () => {
  assert.match(sql, /PostgreSQL\/runtime evidence remains NOT EXECUTED/);
  assert.match(sql, /both commit orders/i);
  assert.match(sql, /verify no deadlocks/i);
  assert.match(sql, /grade-publication authorization in service/i);
  assert.match(sql, /immutable grade-history model/i);
});
