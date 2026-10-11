-- Chat 6 DB-008. UNREGISTERED COMPANION, not an independent DB05 migration.
-- DO NOT EXECUTE in production or merge into Drizzle journal until W01
-- integrates paired readers/writers, optimistic CAS and disposable PG tests.
--
-- Source oracle: legacy BE 21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- LessonServiceImpl.deleteLesson: @Transactional lesson is_deleted=true,
-- then ALL its contents is_deleted=true. LessonServiceImpl.restoreLesson:
-- lesson is_deleted=false ONLY; DO NOT restore any child content.
-- LessonContentsServiceImpl.deleteLessonContent: content is_deleted=true,
-- active=false, enabled=false; files may be deleted and are NOT recoverable.
-- VNext course_lessons.status=ACTIVE/ARCHIVED and
-- lesson_contents.status=DRAFT/PUBLISHED/ARCHIVED are NOT equivalent to
-- independent legacy soft-delete state or explicit restore behavior.
--
-- Tombstone timestamps are a proposed vNext boolean-equivalent state:
-- NULL = not deleted, non-NULL = deleted. Historical deletion times cannot
-- be reconstructed from the legacy Boolean (greenfield vNext only).
-- This draft stages data constraints; it does not authorize API activation.
BEGIN;

ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz;

ALTER TABLE lesson_contents
  ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS db05_course_lessons_legacy_live_idx
  ON course_lessons (learning_path_id, sequence, id)
  WHERE legacy_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS db05_lesson_contents_legacy_live_idx
  ON lesson_contents (lesson_id, sequence, id)
  WHERE legacy_deleted_at IS NULL;

-- Cascading child tombstones occurs in the SAME SQL transaction. Preserve
-- a child that was already independently deleted (its original timestamp
-- and state cannot be inferred/reconstructed from a later lesson delete).
CREATE OR REPLACE FUNCTION db05_cascade_lesson_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_lesson_tombstone$
BEGIN
  IF OLD.legacy_deleted_at IS NULL
     AND NEW.legacy_deleted_at IS NOT NULL THEN
    UPDATE lesson_contents c
       SET legacy_deleted_at = NEW.legacy_deleted_at,
           updated_at = now()
     WHERE c.lesson_id = NEW.id
       AND c.legacy_deleted_at IS NULL;
  END IF;

  -- Deliberately NO reverse cascade when a lesson is restored.
  -- Restoring child rows would resurrect previously independently deleted
  -- items and possibly private files already destroyed from storage.
  RETURN NEW;
END;
$db05_lesson_tombstone$;

CREATE TRIGGER db05_course_lessons_soft_delete_cascade_after_update
AFTER UPDATE OF legacy_deleted_at
ON course_lessons
FOR EACH ROW
EXECUTE FUNCTION db05_cascade_lesson_soft_delete();

COMMIT;

-- Source/runtime gates still OPEN (NONE EXECUTED):
--  1. Individual deleted content remains deleted after lesson delete/restore.
--  2. All live sibling content rows become tombstoned atomically on lesson
--     delete; only lesson tombstone removed on lesson restore.
--  3. Child restore must be separately authorized, and only if file receipt
--     status confirms asset still exists; deleted video/file not resurrected.
--  4. Lesson & content learner read scopes enforce legacy_deleted_at IS NULL
--     as an additional gate to PUBLISHED and both active/enabled fields.
--  5. Lesson update, content create/move, direct SQL writes to a deleted
--     parent must NOT accidentally re-expose child content. Child trigger
--     on parent move/insert or write-scope immutability required.
--  6. Deleted course/path/lesson ancestor still hides descendant content.
--  7. Trigger child UPDATE increments history/versions consistently;
--     concurrent lesson editing and reparenting can never race to leak.
--  8. Two-session delete/move/restore races and wrong-college restore denied
--     on actual disposable PostgreSQL under documented transaction level.
--  9. No current vNext route interprets these draft columns; API must
--     change atomically with registered W01 migrations.
