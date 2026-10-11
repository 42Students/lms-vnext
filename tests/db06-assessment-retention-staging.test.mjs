import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync(
  "docs/planning/sql/db06-assessment-history-retention-candidate.sql",
  "utf8",
);
const contract = fs.readFileSync(
  "docs/planning/database-parity-db06-assessment-retention-contract.md",
  "utf8",
);
const ledger = JSON.parse(
  fs.readFileSync(
    "docs/planning/database-parity-db06-field-reconciliation.json",
    "utf8",
  ),
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);
const quizAttemptService = fs.readFileSync(
  "src/modules/courses/quiz-attempt-service.ts",
  "utf8",
);

test("DB038 remains source-only and unregistered", () => {
  assert.match(sql, /DB-038 \/ DB06 SOURCE-ONLY CANDIDATE/);
  assert.equal(
    journal.entries.some((entry) =>
      /assessment.*retention|history.*retention/i.test(entry.tag),
    ),
    false,
  );
  assert.match(contract, /source-only staging/i);
});

test("DB038 makes submitted quiz attempts and answer snapshots append-only", () => {
  for (const trigger of [
    "db06_quiz_attempts_no_update_delete",
    "db06_quiz_attempts_no_truncate",
    "db06_quiz_attempt_answers_no_update_delete",
    "db06_quiz_attempt_answers_no_truncate",
  ]) {
    assert.match(sql, new RegExp(`CREATE TRIGGER ${trigger}`));
  }
  assert.match(
    sql,
    /DB06 submitted assessment history is immutable/,
  );
});

test("DB038 freezes only learner assignment payload while preserving grading workflow", () => {
  const start = sql.indexOf(
    "CREATE FUNCTION db06_guard_assignment_submission_payload_immutable",
  );
  const end = sql.indexOf(
    "CREATE TRIGGER db06_assignment_submission_payload_immutable",
    start,
  );
  const guard = sql.slice(start, end);

  for (const field of [
    "assignment_id",
    "delivery_id",
    "membership_id",
    "submission_type",
    "text_content",
    "submission_url",
    "submitted_at",
    "created_at",
  ]) {
    assert.ok(guard.includes(field), field);
  }
  for (const mutableGradeField of [
    "points_awarded",
    "feedback",
    "grading_status",
    "grade_published",
    "graded_by_user_id",
    "graded_at",
    "version",
  ]) {
    assert.equal(
      guard.includes(mutableGradeField),
      false,
      `grading field unexpectedly frozen: ${mutableGradeField}`,
    );
  }
  assert.match(sql, /db06_assignment_submissions_no_delete/);
  assert.match(sql, /db06_assignment_submissions_no_truncate/);
});

test("DB038 authoring guard permits only attempt-free DRAFT quiz definitions", () => {
  assert.match(
    sql,
    /target_status <> 'DRAFT'[\s\S]*quiz_attempts/,
  );
  assert.match(
    sql,
    /DB06 quiz questions are immutable outside attempt-free DRAFT/,
  );
  assert.match(
    sql,
    /DB06 quiz options are immutable outside attempt-free DRAFT/,
  );
  assert.match(
    sql,
    /DB06 quiz question parent is immutable/,
  );
  assert.match(
    sql,
    /DB06 quiz option parent is immutable/,
  );
  assert.match(
    sql,
    /DB06 quiz scoring definition is immutable after attempts/,
  );
});

test("DB038 shares the live attempt advisory-lock namespace and enforces sequence/max attempts", () => {
  assert.match(
    quizAttemptService,
    /pg_advisory_xact_lock\([\s\S]*6206001/,
  );
  assert.match(
    sql,
    /pg_advisory_xact_lock\([\s\S]*6206001/,
  );
  assert.match(sql, /DB06 quiz max attempts reached/);
  assert.match(
    sql,
    /DB06 quiz attempt number must be sequential/,
  );
  assert.match(
    sql,
    /NEW\.attempt_number <> used \+ 1/,
  );
});

test("DB038 requires quiz total_points to equal authored question points at commit", () => {
  for (const trigger of [
    "db06_quiz_total_points_from_quiz",
    "db06_quiz_total_points_from_questions",
  ]) {
    assert.match(
      sql,
      new RegExp(`CREATE CONSTRAINT TRIGGER ${trigger}`),
    );
  }
  assert.ok(
    (sql.match(/DEFERRABLE INITIALLY DEFERRED/g) ?? []).length >= 3,
  );
  assert.match(
    sql,
    /DB06 quiz total points do not match authored questions/,
  );
});

test("DB038 validates answer snapshots against the committed question and option definition", () => {
  for (const token of [
    "db06_quiz_answer_snapshot_guard",
    "question_type",
    "prompt_snapshot",
    "points_possible",
    "options_snapshot",
    "selected_option_ids",
    "duplicate selected option ids",
    "option outside committed question",
    "single-choice answer selected multiple options",
    "answer correctness/points do not match committed options",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    sql,
    /jsonb_agg\([\s\S]*jsonb_build_object\([\s\S]*'id'[\s\S]*'text'[\s\S]*'sequence'[\s\S]*'correct'/,
  );
});

test("DB038 requires a complete coherent answer set before an attempt can commit", () => {
  assert.match(
    sql,
    /CREATE CONSTRAINT TRIGGER db06_complete_quiz_attempt_required/,
  );
  assert.match(
    sql,
    /answer_count <> question_count/,
  );
  assert.match(sql, /answer_score <> NEW\.score/);
  assert.match(sql, /answer_max <> NEW\.max_score/);
  assert.match(sql, /quiz_total <> NEW\.max_score/);
  assert.match(
    sql,
    /DB06 quiz attempt is missing or inconsistent answer snapshots/,
  );
});

test("DB038 preflight is non-destructive and covers score, sequence and definition drift", () => {
  const start = sql.indexOf("DO $db06_retention_preflight$");
  const end = sql.indexOf(
    "$db06_retention_preflight$;",
    start,
  );
  assert.ok(start >= 0);
  assert.ok(end > start);
  const preflight = sql.slice(
    start,
    end + "$db06_retention_preflight$;".length,
  );

  for (const token of [
    "quiz total points mismatch authored questions",
    "invalid quiz attempt sequence/max-attempt history",
    "inconsistent quiz attempt",
    "answer snapshots mismatch committed definition",
  ]) {
    assert.ok(preflight.includes(token), token);
  }
  assert.doesNotMatch(preflight, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(preflight, /\bUPDATE\s+\w+\s+SET\b/i);
  assert.doesNotMatch(preflight, /\bTRUNCATE\b/i);
});

test("DB038 closes the DB009 quiz status and soft-delete disposition gaps", () => {
  const attempts = ledger.tables.find(
    (table) => table.legacyTable === "quiz_attempts",
  );
  const answers = ledger.tables.find(
    (table) => table.legacyTable === "quiz_answers",
  );
  assert.ok(attempts);
  assert.ok(answers);

  const status = attempts.fields.find(
    (field) => field.legacyField === "status",
  );
  assert.equal(
    status.decision,
    "DERIVED_METADATA_NOT_PERSISTED",
  );

  for (const table of [attempts, answers]) {
    const deleted = table.fields.find(
      (field) => field.legacyField === "is_deleted",
    );
    assert.equal(
      deleted.decision,
      "NORMALIZED_TO_IMMUTABLE_HISTORY",
    );
    assert.match(
      deleted.validationEvidence,
      /db06-assessment-history-retention-candidate\.sql/,
    );

    const updated = table.fields.find(
      (field) => field.legacyField === "updated_at",
    );
    assert.equal(
      updated.decision,
      "NORMALIZED_TO_IMMUTABLE_HISTORY",
    );
  }
});

test("DB038 contract preserves the 24 PostgreSQL promotion witnesses", () => {
  for (let i = 1; i <= 24; i += 1) {
    assert.match(
      contract,
      new RegExp(`^\\s*${i}\\.\\s`, "m"),
      `missing PostgreSQL witness ${i}`,
    );
  }
});
