import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const draft = read("../scripts/sql/db05-version-progress-attempts.draft.sql");
const contract = read("../docs/planning/db05-progress-deletion-attempt-contract.md");
const schema = read("../src/db/schema/courses.ts");
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));

test("DB05 progress draft retains attempts plus source-backed tombstone without activation", () => {
  assert.match(draft, /NOT A REGISTERED MIGRATION/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS first_completed_at timestamptz/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS deleted_at timestamptz/);
  assert.match(draft, /learner_content_progress_membership_content_attempt_uq/);
  assert.match(draft, /db05_progress_first_completion_guard/);
});

test("latest attempt selected before soft-delete filtering avoids historical resurrection", () => {
  assert.match(contract, /MAX attempt/);
  assert.match(contract, /after.*restricting/);
  assert.match(contract, /attempt 1/);
  assert.match(contract, /attempt 2/);
  assert.match(contract, /incorrectly resurrect/);
  assert.match(draft, /Do NOT compute MAX\(attempt\)/);
});

test("vNext still has legacy-disjoint progress identity; no false parity promotion", () => {
  assert.match(schema, /export const learnerContentProgress = pgTable/);
  assert.match(schema, /learner_content_progress_membership_content_uq/);
  const row = review.fields.find((field) => field.source === "learner_content_progress.is_deleted");
  assert.ok(row);
  assert.equal(row.semanticVerification, "NOT_VERIFIED");
  assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
  assert.ok(["MISSING_OR_UNPROVEN", "UNREGISTERED_DRAFT"].includes(row.classification));
});

test("contract gates tenant, history, race and migration acceptance", () => {
  for (const term of [
    "cross-college", "first_completed_at", "startNewAttempt",
    "PostgreSQL replay", "Chat 1", "distinct parity decisions",
  ]) {
    assert.ok(contract.includes(term), term);
  }
});

test("readiness manifest blocks progress tombstone until consumer and PostgreSQL proofs", () => {
  const manifest = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));
  const draft = manifest.artifacts.find((a) => a.id === "db05-version-progress");
  assert.ok(draft);
  assert.equal(draft.registered, false);
  assert.equal(draft.executedAgainstPostgres, false);
  assert.equal(draft.sourceDeletionContract.candidateColumn, "learner_content_progress.deleted_at");
  assert.equal(draft.sourceDeletionContract.consumerVerified, false);
  assert.equal(draft.sourceDeletionContract.postgresVerified, false);
  for (const prerequisite of [
    "PROGRESS_TOMBSTONE_PER_READER_POLICY",
    "PROGRESS_LATEST_ATTEMPT_BEFORE_DELETION_FILTER",
    "PROGRESS_MEMBERSHIP_CONTENT_TENANT_NEGATIVE",
  ]) {
    assert.ok(draft.prereqs.includes(prerequisite), prerequisite);
  }
  assert.ok(manifest.gates.some((gate) =>
    gate.id === "PROGRESS_LATEST_ATTEMPT_SOFT_DELETE_CONSUMERS" && gate.status === "BLOCKED"));
  assert.ok(manifest.gates.some((gate) =>
    gate.id === "PROGRESS_SOFT_DELETE_TENANT_RACE_NEGATIVE" && gate.status === "NOT_RUN"));
});

test("separate unregistered progress guard checks content, offering and membership college", () => {
  const guard = read("../scripts/sql/db05-progress-same-college.draft.sql");
  assert.match(guard, /UNREGISTERED/);
  for (const fragment of [
    "lesson_contents",
    "course_lessons",
    "course_learning_paths",
    "course_offerings",
    "academic_periods",
    "courses",
    "departments",
    "college_memberships",
    "course_section_deliveries",
    "sections",
    "content_period_college_id IS DISTINCT FROM course_department_college_id",
    "content_period_college_id IS DISTINCT FROM author_membership_college_id",
    "delivery_offering_id IS DISTINCT FROM content_offering_id",
    "delivery_section_period_college_id IS DISTINCT FROM content_period_college_id",
    "BEFORE INSERT OR UPDATE OF membership_id, lesson_content_id",
    "23514",
  ]) {
    assert.ok(guard.includes(fragment), fragment);
  }
  assert.doesNotMatch(guard, /ALTER TABLE learner_content_progress/);
  assert.match(contract, /child-row guard/);
  assert.match(contract, /upstream reparenting/);
});
