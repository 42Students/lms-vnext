import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const cascade = read("../scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql");
const owner = read("../scripts/sql/db05-lesson-content-faculty-owner.draft.sql");
const schema = read("../src/db/schema/courses.ts");
const contentWriter = read("../src/modules/courses/lesson-content-service.ts");
const manifest = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));

test("DB05 lesson tombstones and content tombstones are distinct from publication", () => {
  assert.match(cascade, /UNREGISTERED COMPANION/);
  assert.match(cascade, /ALTER TABLE course_lessons\s+ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz/);
  assert.match(cascade, /ALTER TABLE lesson_contents\s+ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz/);
  assert.match(schema, /courseLessons = pgTable/);
  assert.match(schema, /lessonContents = pgTable/);
  assert.match(schema, /status: courseLessonStatusEnum/);
  assert.match(schema, /status: lessonContentStatusEnum/);
});

test("DB05 lesson deletion tombstones contents but never resurrects separately deleted children", () => {
  assert.match(cascade, /AFTER UPDATE OF legacy_deleted_at/);
  assert.match(cascade, /OLD\.legacy_deleted_at IS NULL\s+AND NEW\.legacy_deleted_at IS NOT NULL/);
  assert.match(cascade, /SET legacy_deleted_at = NEW\.legacy_deleted_at/);
  assert.match(cascade, /WHERE c\.lesson_id = NEW\.id\s+AND c\.legacy_deleted_at IS NULL/);
  assert.match(cascade, /NO reverse cascade when a lesson is restored/);
  assert.doesNotMatch(cascade, /SET legacy_deleted_at = NULL/);
});

test("DB05 learner read filters currently lack tombstone; migration stays blocked", () => {
  assert.match(contentWriter, /lessonContents\.status,\s*"PUBLISHED"/);
  assert.doesNotMatch(contentWriter, /lessonContents\.legacyDeletedAt/);
  assert.match(cascade, /API must[\s\S]{0,20}change atomically with registered W01 migrations/);
  assert.equal(manifest.artifacts.filter(x => x.registered).length, 0);
});

test("DB05 nullable owner membership is not a creator alias", () => {
  assert.match(owner, /ADD COLUMN faculty_owner_membership_id uuid/);
  assert.match(owner, /REFERENCES college_memberships\(id\) ON DELETE RESTRICT/);
  assert.match(schema, /createdByUserId: uuid\("created_by_user_id"\)/);
  assert.match(owner, /Legacy LessonContents\.facultyId/);
  assert.match(owner, /Generic content has no assigned owner/);
});

test("DB05 owner scoped against college, offering, cohort, period and delivery", () => {
  for (const keyword of ["JOIN course_learning_paths path", "JOIN course_offerings offering", "JOIN departments department", "JOIN academic_periods period","FROM college_memberships membership", "LEFT JOIN course_section_deliveries delivery"]) {
    assert.ok(owner.includes(keyword), keyword);
  }
  for (const keyword of [
    "course_college_id IS DISTINCT FROM owner_college_id",
    "course_college_id IS DISTINCT FROM period_college_id",
    "delivery_offering_id IS DISTINCT FROM content_offering_id",
    "section_period_college_id IS DISTINCT FROM course_college_id"
  ]) assert.ok(owner.includes(keyword), keyword);
  assert.match(owner, /USING ERRCODE = '23514'/);
});

test("DB05 owner and soft-delete mappings still unverified", () => {
  for (const source of ["lesson.is_deleted","lesson_contents.is_deleted","lesson_contents.faculty_id"]) {
    const item = review.fields.find(row => row.source === source);
    assert.ok(item, source);
    assert.equal(item.semanticVerification, "NOT_VERIFIED", source);
    assert.equal(item.runtimeDatabaseVerification, "NOT_RUN", source);
  }
});

test("DB05 owner upstream reparent and role security require independent proof", () => {
  assert.match(owner, /upstream offering\/path\/department\/period\/membership/);
  assert.match(owner, /row-write trigger/);
  assert.match(owner, /membership_role\.role::text = 'FACULTY'/);
  assert.match(cascade, /two-session delete\/move\/restore races/);
  assert.match(owner, /migration replay and wrong-tenant\/role\/concurrency tests actually run/);
});

test("DB05 child insert and reparent block live content under deleted parent", () => {
  assert.match(cascade, /CREATE OR REPLACE FUNCTION db05_lesson_content_live_parent_guard/);
  assert.match(cascade, /SELECT lesson\.legacy_deleted_at INTO parent_deleted_at/);
  assert.match(cascade, /FOR SHARE/);
  assert.match(cascade, /parent_deleted_at IS NOT NULL AND NEW\.legacy_deleted_at IS NULL/);
  assert.match(cascade, /BEFORE INSERT OR UPDATE OF lesson_id, legacy_deleted_at/);
  assert.match(cascade, /USING ERRCODE = '23514'/);
});

test("DB05 delete versus insert race remains PostgreSQL-unverified", () => {
  assert.match(cascade, /Must be verified with two PostgreSQL sessions/);
  assert.match(cascade, /parent deletion sees\/cascades the new child/);
  assert.match(cascade, /insert waits and then rejects/);
  assert.match(cascade, /two-session delete\/move\/restore races/);
});
