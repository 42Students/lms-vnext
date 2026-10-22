import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const staged = fs.readFileSync(
  "src/db/schema/db06-quiz-lifecycle-staged.ts",
  "utf8",
);
const sql = fs.readFileSync(
  "docs/planning/sql/db06-quiz-lifecycle-history-candidate.sql",
  "utf8",
);
const contract = fs.readFileSync(
  "docs/planning/database-parity-db06-quiz-lifecycle-contract.md",
  "utf8",
);
const barrel = fs.readFileSync(
  "src/db/schema/index.ts",
  "utf8",
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);
const validation = fs.readFileSync(
  "src/modules/courses/quiz-validation.ts",
  "utf8",
);
const quizService = fs.readFileSync("src/modules/courses/quiz-service.ts","utf8");

test("DB052 quiz lifecycle history remains source-only and unregistered", () => {
  assert.match(staged, /DB-052 \/ DB06 SOURCE-ONLY staging/);
  assert.doesNotMatch(barrel, /db06-quiz-lifecycle-staged/);
  assert.equal(
    journal.entries.some((entry) =>
      /quiz.*lifecycle|lifecycle.*quiz/i.test(entry.tag),
    ),
    false,
  );
  assert.match(sql, /DO NOT REGISTER INDEPENDENTLY/);
});

test("DB052 lifecycle event stores audience actor role state and exact version", () => {
  for (const token of [
    "course_quiz_lifecycle_events",
    "college_id",
    "delivery_id",
    "actor_user_id",
    "actor_membership_id",
    "actor_role",
    "previous_status",
    "new_status",
    "previous_results_published",
    "new_results_published",
    "lifecycle_version_before",
    "lifecycle_version_after",
    "course_quiz_lifecycle_events_quiz_version_uq",
  ]) {
    assert.ok(sql.includes(token), token);
    assert.ok(staged.includes(token), token);
  }
});

test("DB052 preserves active UNPUBLISH parity now implemented by validated transition", () => {
  assert.match(sql, /'UNPUBLISH'/);
  assert.match(contract, /PUBLISHED -> DRAFT.*UNPUBLISH/i);
  const transitionStart = validation.indexOf(
    "export const quizTransitionSchema",
  );
  const transitionEnd = validation.indexOf(
    "export const setQuizResultsInputSchema",
    transitionStart,
  );
  const transition = validation.slice(
    transitionStart,
    transitionEnd,
  );
  assert.match(transition, /"PUBLISH"/);
  assert.match(transition, /"CLOSE"/);
  assert.match(transition, /"ARCHIVE"/);
  assert.match(transition, /"UNPUBLISH"/);
  assert.match(quizService, /input\.action === "UNPUBLISH" && current\.status !== "PUBLISHED"/);
  assert.match(quizService, /INVALID_QUIZ_TRANSITION/);
});

test("DB052 row state machine versions lifecycle mutations exactly once", () => {
  for (const token of [
    "ADD COLUMN lifecycle_version integer NOT NULL DEFAULT 0",
    "new quiz must start DRAFT, unpublished, lifecycle version 0",
    "lifecycle version cannot change without lifecycle mutation",
    "lifecycle_version is database-managed",
    "status and result visibility must transition separately",
    "cannot publish quiz after due time",
    "cannot publish quiz without scored questions",
    "invalid quiz lifecycle transition",
    "invalid quiz result-publication transition",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    sql,
    /OLD\.status::text = 'PUBLISHED'[\s\S]*NEW\.status::text IN \('DRAFT','CLOSED','ARCHIVED'\)/,
  );
  assert.match(
    sql,
    /OLD\.results_published = false[\s\S]*NEW\.results_published = true[\s\S]*NEW\.status::text = 'CLOSED'/,
  );
});

test("DB052 quiz scope creator identity is immutable", () => {
  for (const field of [
    "lesson_id",
    "delivery_id",
    "created_by_user_id",
    "created_at",
  ]) {
    assert.ok(sql.includes(`NEW.${field} IS DISTINCT FROM OLD.${field}`));
  }
  assert.match(
    sql,
    /quiz scope\/creator identity is immutable/,
  );
});

test("DB052 actor scope mirrors coarse quiz mutation authorization", () => {
  for (const token of [
    "SUPER_ADMIN",
    "COLLEGE_ADMIN",
    "FACULTY",
    "course_teaching_assignments",
    "cta.delivery_id = quiz_delivery",
    "cta.ended_at IS NULL",
    "generic quiz lifecycle requires college-admin scope",
    "CREATE event actor must equal created_by_user_id",
    "quiz lifecycle actor membership mismatch",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    contract,
    /generic quiz cannot use a FACULTY lifecycle actor/i,
  );
});

test("DB052 row-event completeness is bidirectional and deferred", () => {
  for (const trigger of [
    "db06_quiz_lifecycle_event_required",
    "db06_quiz_lifecycle_event_target",
  ]) {
    assert.match(
      sql,
      new RegExp(`CREATE CONSTRAINT TRIGGER ${trigger}`),
    );
  }
  assert.ok(
    (sql.match(/DEFERRABLE INITIALLY DEFERRED/g) ?? []).length >= 2,
  );
  assert.match(
    sql,
    /quiz lifecycle mutation missing immutable event/,
  );
  assert.match(
    sql,
    /quiz lifecycle event is orphaned or ahead of final quiz state/,
  );
  assert.match(
    sql,
    /quiz lifecycle event breaks version\/state chain/,
  );
  assert.match(
    sql,
    /latest lifecycle event does not match final quiz state/,
  );
});

test("DB052 existing rows use actorless BASELINE rather than fabricated history", () => {
  assert.match(sql, /'BASELINE'/);
  assert.match(
    sql,
    /INSERT INTO course_quiz_lifecycle_events[\s\S]*'BASELINE'/,
  );
  assert.match(
    contract,
    /BASELINE.*no actor|actor fields remain null/i,
  );
  assert.match(
    contract,
    /infer actor from created_by_user_id except CREATE/i,
  );
});

test("DB052 lifecycle event and quiz retirement are append-only", () => {
  for (const trigger of [
    "db06_quiz_lifecycle_events_no_update_delete",
    "db06_quiz_lifecycle_events_no_truncate",
    "db06_course_quizzes_no_delete",
    "db06_course_quizzes_no_truncate",
  ]) {
    assert.match(sql, new RegExp(`CREATE TRIGGER ${trigger}`));
  }
  assert.match(
    sql,
    /quiz lifecycle history is append-only/,
  );
});


test("DB052 staged Drizzle and SQL keep lifecycle booleans/actions aligned", () => {
  for (const action of [
    "BASELINE",
    "CREATE",
    "PUBLISH",
    "UNPUBLISH",
    "CLOSE",
    "ARCHIVE",
    "RESULTS_PUBLISH",
    "RESULTS_UNPUBLISH",
  ]) {
    assert.ok(staged.includes(`'${action}'`), `staged missing ${action}`);
    assert.ok(sql.includes(`'${action}'`), `sql missing ${action}`);
  }

  assert.match(
    staged,
    /boolean\("previous_results_published"\)/,
  );
  assert.match(
    staged,
    /boolean\("new_results_published"\)\.notNull\(\)/,
  );
  assert.doesNotMatch(
    staged,
    /integer\("previous_results_published"\)|integer\("new_results_published"\)/,
  );
});

test("DB052 lifecycle version is database-managed on state mutations", () => {
  assert.match(
    sql,
    /NEW\.lifecycle_version IS DISTINCT FROM OLD\.lifecycle_version[\s\S]*lifecycle_version is database-managed/,
  );
  assert.match(
    sql,
    /NEW\.lifecycle_version := OLD\.lifecycle_version \+ 1/,
  );
  assert.match(
    contract,
    /increments exactly once \*\*inside the database guard\*\*/,
  );
  assert.match(
    contract,
    /callers may not supply\/skip\/reuse lifecycle versions/,
  );
});


test("DB052 ordered event chain supports multi-step lifecycle transactions", () => {
  assert.match(
    sql,
    /NEW\.lifecycle_version_after > final_version/,
  );
  assert.match(
    sql,
    /previous\.lifecycle_version_after = NEW\.lifecycle_version_before/,
  );
  assert.match(
    sql,
    /previous\.new_status = NEW\.previous_status/,
  );
  assert.match(
    sql,
    /previous\.new_results_published IS NOT DISTINCT FROM[\s\S]*NEW\.previous_results_published/,
  );
  assert.match(
    contract,
    /Multiple ordered lifecycle mutations in one transaction are allowed/,
  );
  assert.match(
    contract,
    /CREATE\(DRAFT, version 0\).*PUBLISH\(version 1\)/,
  );
});
