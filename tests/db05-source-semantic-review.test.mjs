import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));
const inventory = readJson("docs/planning/db-pass4-columns-db05_courses_and_content.json");
const review = readJson("docs/planning/db05-chat06-source-semantic-review.json");
const draft = readFileSync(join(root, "scripts/sql/db05-version-progress-attempts.draft.sql"), "utf8");

test("DB05 field review accounts for every historical snapshot column exactly once", () => {
  const original = inventory.tables.flatMap((t) => t.rows.map((r) => `${t.table}.${r.legacyColumn}`)).sort();
  const reviewed = review.fields.map((f) => f.source).sort();
  assert.equal(review.taskId, "DB-008");
  assert.equal(review.phase, "DATABASE");
  assert.equal(new Set(reviewed).size, reviewed.length);
  assert.deepEqual(reviewed, original);
  assert.equal(review.counts.sourceFields, original.length);
  assert.equal(review.counts.sourceTables, inventory.tables.length);
});

test("DB05 review does not mistake source candidates for verified behavior", () => {
  for (const field of review.fields) {
    assert.equal(field.semanticVerification, "NOT_VERIFIED", field.source);
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN", field.source);
    assert.equal(field.producerConsumerVerification, "NOT_VERIFIED", field.source);
    assert.ok(field.targetProposal.length > 5, field.source);
    assert.ok(field.classification.length > 5, field.source);
  }
  assert.ok(review.criticalOpenRisks.length >= 8);
});

test("DB05 draft records legacy concurrency and progress-history contracts", () => {
  assert.match(draft, /NOT A REGISTERED MIGRATION/);
  assert.match(draft, /ALTER TABLE courses\s+ADD COLUMN IF NOT EXISTS version bigint/i);
  assert.match(draft, /ALTER TABLE course_lessons\s+ADD COLUMN IF NOT EXISTS version bigint/i);
  assert.match(draft, /ALTER TABLE lesson_contents\s+ADD COLUMN IF NOT EXISTS version bigint/i);
  for (const field of ["attempt", "duration_seconds", "first_completed_at"]) {
    assert.ok(draft.includes(field), field);
  }
  assert.match(draft, /DROP INDEX IF EXISTS learner_content_progress_membership_content_uq/);
  assert.match(draft, /CREATE UNIQUE INDEX learner_content_progress_membership_content_attempt_uq/);
  assert.match(draft, /CREATE TRIGGER db05_progress_first_completion_before_write/);
  assert.match(draft, /first_completed_at is immutable/);
  assert.match(draft, /version-aware|version=version\+1/i);
});

const discussionDraft = readFileSync(
  join(root, "scripts/sql/db05-lesson-content-discussions.draft.sql"), "utf8"
);

test("DB05 keeps lesson content discussions separate from classroom delivery chat", () => {
  assert.match(discussionDraft, /NOT A REGISTERED DRIZZLE MIGRATION/i);
  assert.match(discussionDraft, /CREATE TABLE IF NOT EXISTS lesson_content_discussions/);
  assert.doesNotMatch(discussionDraft, /CREATE TABLE(?: IF NOT EXISTS)? course_discussion_messages/);
  assert.match(discussionDraft, /lesson_content_id uuid NOT NULL REFERENCES lesson_contents/);
  assert.match(discussionDraft, /author_membership_id uuid NOT NULL REFERENCES college_memberships/);
  assert.match(discussionDraft, /FOREIGN KEY \(parent_discussion_id, lesson_content_id\)/);
  assert.match(discussionDraft, /db05_lesson_discussions_tenant_guard/);
  assert.match(discussionDraft, /scoped_college_id IS DISTINCT FROM NEW\.college_id/);
  assert.match(discussionDraft, /author_college_id IS DISTINCT FROM NEW\.college_id/);
  assert.match(discussionDraft, /resolver_college_id IS DISTINCT FROM NEW\.college_id/);
  const discussions = review.fields.filter((row) => row.source.startsWith("discussions."));
  assert.equal(discussions.length, 16);
  assert.ok(discussions.every((row) => row.classification === "UNREGISTERED_DRAFT"));
  assert.ok(discussions.every((row) => row.semanticVerification === "NOT_VERIFIED"));
});

test("DB05 historical discussion extensions remain unverified", () => {
  const snapshotOnly = [
    "parent_discussion_id",
    "discussion_status",
    "is_faculty_answer",
    "resolved_at",
    "resolved_by",
    "attachment_url",
  ];
  for (const col of snapshotOnly) {
    const item = review.fields.find((row) => row.source === `discussions.${col}`);
    assert.ok(item, col);
    assert.equal(item.sourceContractStatus, "HISTORICAL_COLUMN_ONLY_API_USAGE_NOT_PROVEN");
    assert.equal(item.runtimeDatabaseVerification, "NOT_RUN");
  }
});

const courseIdentityDraft = readFileSync(
  join(root, "scripts/sql/db05-course-identity.draft.sql"), "utf8"
);

test("DB05 course identity keeps slug reserved and short title distinct from code", () => {
  assert.match(courseIdentityDraft, /NOT a registered migration/i);
  assert.match(courseIdentityDraft, /ADD COLUMN IF NOT EXISTS short_title varchar\(255\)/);
  assert.match(courseIdentityDraft, /ADD COLUMN IF NOT EXISTS slug varchar\(64\)/);
  assert.match(courseIdentityDraft, /CREATE UNIQUE INDEX db05_course_slug_reserved_uq/);
  assert.match(courseIdentityDraft, /WHERE slug IS NOT NULL/);
  assert.match(courseIdentityDraft, /lower\(btrim\(short_title\)\)/);
  assert.match(courseIdentityDraft, /lower\(btrim\(name\)\)/);
  for (const key of ["course.slug", "course.short_title", "course.short_title_key", "course.course_name_key"]) {
    const field = review.fields.find((row) => row.source === key);
    assert.ok(field, key);
    assert.equal(field.classification, "UNREGISTERED_DRAFT", key);
    assert.equal(field.semanticVerification, "NOT_VERIFIED", key);
  }
});
