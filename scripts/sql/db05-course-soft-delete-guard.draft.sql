-- Chat 6 DB-008 / DATABASE. UNREGISTERED SCHEMA/INTEGRITY COMPANION.
-- Not an eighth independent migration. W01 owns migration journal, Drizzle
-- schema barrel, clean replay and integration of upstream invariants.
--
-- Legacy BE 21bad59d4dfaf2fa11fdeaf9353327ce105697d5:
-- CourseServiceImpl.deleteCourse calls LessonContentsRepository.countByCourseId
-- and LessonRepository.countActiveByCourseId. BOTH repository queries exclude
-- is_deleted=true: deleting course with any LIVE content OR LIVE lesson fails.
-- CourseServiceImpl.restoreCourse confirms selected college, then clears only
-- course.isDeleted (does not restore any lesson, material, or course mapping).
-- vNext courses.status=ACTIVE/ARCHIVED != legacy independent tombstone.
-- Retired items remain preserved and must not block course deletion.
--
-- This SOURCE DRAFT is not safe to deploy until API state and read filters
-- use it. Child triggers do not prevent all upstream offering/membership/
-- path moves; the entire course subtree integrity still needs acceptance.
BEGIN;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS db05_courses_live_department_idx
  ON courses (department_id, id)
  WHERE legacy_deleted_at IS NULL;

CREATE OR REPLACE FUNCTION db05_course_soft_delete_live_descendants_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_course_tomb$
DECLARE
  live_lesson boolean;
  live_content boolean;
BEGIN
  IF OLD.legacy_deleted_at IS NULL
     AND NEW.legacy_deleted_at IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM course_offerings offering
      JOIN course_learning_paths path ON path.offering_id = offering.id
      JOIN course_lessons lesson ON lesson.learning_path_id = path.id
      WHERE offering.course_id = NEW.id
        AND lesson.legacy_deleted_at IS NULL
    ) INTO live_lesson;

    SELECT EXISTS(
      SELECT 1 FROM course_offerings offering
      JOIN course_learning_paths path ON path.offering_id = offering.id
      JOIN course_lessons lesson ON lesson.learning_path_id = path.id
      JOIN lesson_contents content ON content.lesson_id = lesson.id
      WHERE offering.course_id = NEW.id
        AND content.legacy_deleted_at IS NULL
    ) INTO live_content;

    IF live_lesson OR live_content THEN
      RAISE EXCEPTION 'course with live lesson or content cannot be deleted'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$db05_course_tomb$;

CREATE TRIGGER db05_courses_soft_delete_live_descendants_before_update
BEFORE UPDATE OF legacy_deleted_at ON courses
FOR EACH ROW EXECUTE FUNCTION db05_course_soft_delete_live_descendants_guard();

-- Lock canonical course on new, moved or restored LIVE lessons to exclude insertion while a
-- concurrent course DELETE tombstone is evaluating child existence. Existing
-- course soft-delete UPDATE takes conflicting row lock on courses. The
-- SELECT FOR SHARE OF course_row below prevents a phantom live lesson.
-- Does NOT solve upstream offering/path reassignment, which remains gated.
CREATE OR REPLACE FUNCTION db05_live_lesson_parent_course_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_lesson_course$
DECLARE
  course_deleted_at timestamptz;
BEGIN
  -- A tombstoned lesson is historical data; allow continued cleanup and
  -- explicitly deleted inserts. Its content stays blocked by the child guard.
  -- When a lesson becomes LIVE (including deleted->NULL restore with the
  -- same learning_path_id), the owning course must still be live.
  IF NEW.legacy_deleted_at IS NULL THEN
    SELECT course_row.legacy_deleted_at INTO course_deleted_at
      FROM course_learning_paths path
      JOIN course_offerings offering ON offering.id = path.offering_id
      JOIN courses course_row ON course_row.id = offering.course_id
     WHERE path.id = NEW.learning_path_id
     FOR SHARE OF course_row;

    IF NOT FOUND OR course_deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'cannot attach or restore live lesson under deleted course'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db05_lesson_course$;

CREATE TRIGGER db05_course_lessons_live_course_before_write
BEFORE INSERT OR UPDATE OF learning_path_id, legacy_deleted_at
ON course_lessons
FOR EACH ROW EXECUTE FUNCTION db05_live_lesson_parent_course_guard();

COMMIT;

-- NOT EXECUTED: mandatory PostgreSQL/API tests
-- 1. No live lesson and no live content: same-college authorized tombstone
--    accepted; course row retained, no orphaned FK/progress.
-- 2. Any nondeleted lesson blocks delete with 23514, even when zero content.
-- 3. Live content blocks delete even if parent lesson was tombstoned.
-- 4. Already tombstoned lesson+content do NOT block delete.
-- 5. Restoring course removes ONLY course tombstone, not lesson/content flags
--    or deleted private object receipts; verify college/superadmin scope.
-- 6. A concurrent lesson insert while deleting course either completes
--    before parent delete (parent then rejects) OR insert rejects afterwards.
-- 7. Editing course status ARCHIVED is not implicitly a soft delete.
-- 8. Course/department/offering/path reparent between colleges while deleted
--    cannot attach live children or leak tenant data. Not enforced by current
--    trigger, requires W01 upstream guard and independent PG races.
-- 9. Current vNext courses read paths must exclude deleted course once
--    paired API uses tombstones; no existing runtime code reads these fields.
-- 10. Clean PostgreSQL migration replay, rollback, lock order/deadlock
--     testing and tests on exact main SHA before phase acceptance.

-- W06 2026-10-12 source-identified restore hole: before this change, a pure
-- UPDATE course_lessons SET legacy_deleted_at = NULL (same path) did NOT fire
-- the parent-course guard. The expanded UPDATE column list + conditional live
-- check blocks resurrection beneath tombstoned courses while retaining a safe
-- deletion/cleanup path. Execution proof remains open.
-- LR-01 Live lesson INSERT under live course accepted.
-- LR-02 Live lesson INSERT under tombstoned course rejected 23514.
-- LR-03 Tombstoned lesson INSERT under tombstoned course accepted as history.
-- LR-04 Deleted lesson RESTORE under tombstoned course rejected 23514.
-- LR-05 Deleted lesson RESTORE under live course accepted.
-- LR-06 Moving an existing live lesson to a tombstoned course rejected.
-- LR-07 Tombstoning a live lesson when its parent is already tombstoned
--       must not be blocked by this guard (historic repair/cleanup).
-- LR-08 In-place no-op live lesson UPDATE still requires live course.
-- LR-09 Concurrent course deletion vs lesson restore serializes under parent
--       FOR SHARE; at most one succeeds without leaving live child.
-- LR-10 Existing child content tombstones NOT restored with the lesson.
-- LR-11 Wrong-college parent/path moves remain prohibited by paired tenant
--       companion; this guard alone is NOT an authorization boundary.
-- LR-12 Clean disposable PostgreSQL replay and lock/deadlock acceptance with
--       W01. No registered production migration or passing SQL evidence.
