import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const courseGuard = read("../scripts/sql/db05-course-soft-delete-guard.draft.sql");
const childGuard = read("../scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql");
const tombstoneVersion = read("../scripts/sql/db05-tombstone-version-invariant.draft.sql");
const manifest = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));

test("lesson in-place restoration is captured by the guarded trigger", () => {
  assert.match(courseGuard, /BEFORE INSERT OR UPDATE OF learning_path_id, legacy_deleted_at\s+ON course_lessons/);
  assert.match(courseGuard, /IF NEW\.legacy_deleted_at IS NULL THEN/);
  assert.match(courseGuard, /course_row\.legacy_deleted_at INTO course_deleted_at/);
  assert.match(courseGuard, /FOR SHARE OF course_row/);
  assert.match(courseGuard, /IF NOT FOUND OR course_deleted_at IS NOT NULL THEN/);
  assert.match(courseGuard, /cannot attach or restore live lesson under deleted course/);
});

test("parent check skips independently deleted historic lessons, not resurrected rows", () => {
  assert.match(courseGuard, /A tombstoned lesson is historical data/);
  assert.match(courseGuard, /IF NEW\.legacy_deleted_at IS NULL THEN/);
  assert.match(childGuard, /NO reverse cascade when a lesson is restored/);
  assert.match(childGuard, /BEFORE INSERT OR UPDATE OF lesson_id, legacy_deleted_at/);
  assert.match(tombstoneVersion, /BEFORE UPDATE OF legacy_deleted_at ON course_lessons/);
});

test("legacy tombstone stays distinct from archived course status and no rows are destroyed", () => {
  assert.match(courseGuard, /courses\.status=ACTIVE\/ARCHIVED != legacy independent tombstone/);
  assert.doesNotMatch(courseGuard, /^\s*DELETE FROM /m);
  assert.match(courseGuard, /course with live lesson or content cannot be deleted/);
  assert.match(courseGuard, /Restoring course removes ONLY course tombstone/);
});

test("12 disposable PostgreSQL cases are enumerated, not credited as passing", () => {
  for (let n = 1; n <= 12; n++) {
    assert.ok(courseGuard.includes(`LR-${String(n).padStart(2, "0")}`));
  }
  const gate = manifest.gates.find((g) => g.id === "DB05_LESSON_RESTORE_PARENT_LIVE_PG_NEGATIVE");
  assert.ok(gate);
  assert.equal(gate.status, "NOT_RUN");
  const companion = manifest.crossDomainCompanions.find((c) =>
    c.id === "DB05_COURSE_SOFT_DELETE_LIVE_CHILD_GUARD",
  );
  assert.ok(companion);
  assert.equal(companion.registered, false);
  assert.equal(companion.postgresExecuted, false);
});
