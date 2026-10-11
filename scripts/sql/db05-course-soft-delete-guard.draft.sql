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

-- Lock canonical course on new/moved lessons to exclude insertion while a
-- concurrent course DELETE tombstone is evaluating child existence. Existing
-- course soft-delete UPDATE takes conflicting row lock on courses. The
-- SELECT FOR SHARE OF course_row below prevents a phantom live lesson.
-- Does NOT solve upstream offering/path reassignment, which remains gated.
CREATE OR REPLACE FUNCTION db05_live_lesson_parent_course_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_lesson_course$
DECLARE
  course_deleted_at timestamptz;
BEGIN
  SELECT course_row.legacy_deleted_at INTO course_deleted_at
    FROM course_learning_paths path
    JOIN course_offerings offering ON offering.id = path.offering_id
    JOIN courses course_row ON course_row.id = offering.course_id
   WHERE path.id = NEW.learning_path_id
   FOR SHARE OF course_row;

  IF NOT FOUND OR course_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'cannot attach lesson to missing or deleted course'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_lesson_course$;

CREATE TRIGGER db05_course_lessons_live_course_before_write
BEFORE INSERT OR UPDATE OF learning_path_id
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
