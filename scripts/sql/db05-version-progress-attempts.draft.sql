-- DB-008 / DB05 SOURCE-BACKED DRAFT -- NOT A REGISTERED MIGRATION.
-- Author: Chat 6, 2026-10-11. Migration integrator: Chat 1 ONLY.
--
-- Evidence (legacy BE 21bad59d4dfaf2fa11fdeaf9353327ce105697d5):
--   V120: optimistic @Version on course and lesson
--   V121: optimistic @Version on lesson_contents
--   V123: first_completed_at survives an explicit rewatch reset
--   V132: attempt >= 1, uniqueness (learner_id,lesson_content_id,attempt)
--   Legacy: LearnerContentProgress.java, Course.java, Lesson.java, LessonContents.java
-- vNext schema observed: src/db/schema/courses.ts on 2026-10-11.
--
-- PRECONDITIONS (MUST verify before Chat 1 registration):
-- 1. Align progress read/write service with attempt-aware composite key; do not enable
--    this draft until upserts and current-attempt reads are fixed and integration-tested.
-- 2. Update course/lesson/content edits to use WHERE id AND version and atomically
--    version=version+1, reporting a conflict when no row is updated. Merely adding a
--    version column does NOT implement optimistic concurrency.
-- 3. Confirm scope and tenancy invariants for learner membership/content FKs.
-- 4. Execute on disposable PostgreSQL, including migration replay, rollback and
--    negative concurrent writers. NO runtime passing evidence is claimed here.
-- 5. Never port legacy user records: LMS vNext is greenfield.

BEGIN;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE lesson_contents
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;

ALTER TABLE courses
  ADD CONSTRAINT db05_courses_version_nonnegative_ck CHECK (version >= 0);
ALTER TABLE course_lessons
  ADD CONSTRAINT db05_course_lessons_version_nonnegative_ck CHECK (version >= 0);
ALTER TABLE lesson_contents
  ADD CONSTRAINT db05_lesson_contents_version_nonnegative_ck CHECK (version >= 0);

ALTER TABLE learner_content_progress
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_completed_at timestamptz,
  -- BaseModel.is_deleted is inherited by LearnerContentProgress. Current
  -- legacy countCompletedPerLearner excludes deleted rows; omitting this
  -- dimension changes admin completion totals and history semantics.
  -- Greenfield normalization uses a nullable tombstone timestamp.
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE learner_content_progress
  ADD CONSTRAINT db05_progress_attempt_positive_ck CHECK (attempt >= 1),
  ADD CONSTRAINT db05_progress_duration_nonnegative_ck CHECK (duration_seconds >= 0);

-- Safe for current greenfield rows; if a completed record exists already, preserve
-- that completion as its first-ever completion before installing the guard.
UPDATE learner_content_progress
SET first_completed_at = completed_at
WHERE first_completed_at IS NULL AND completed_at IS NOT NULL;

-- Current unique index blocks legitimate attempt 2 rows. Must be replaced in
-- THE SAME DATABASE TRANSACTION after consumers are made attempt-aware.
DROP INDEX IF EXISTS learner_content_progress_membership_content_uq;

CREATE UNIQUE INDEX learner_content_progress_membership_content_attempt_uq
  ON learner_content_progress (membership_id, lesson_content_id, attempt);

CREATE INDEX learner_content_progress_current_attempt_idx
  ON learner_content_progress (membership_id, lesson_content_id, attempt DESC);

-- One-way completion history. Rewatch may clear completed_at, but may never
-- change an already recorded first_completed_at.
CREATE OR REPLACE FUNCTION db05_progress_first_completion_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.first_completed_at IS NOT NULL
     AND NEW.first_completed_at IS DISTINCT FROM OLD.first_completed_at THEN
    RAISE EXCEPTION 'first_completed_at is immutable'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND OLD.first_completed_at IS NULL) THEN
    IF NEW.completed_at IS NOT NULL THEN
      NEW.first_completed_at := NEW.completed_at;
    ELSIF NEW.first_completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'first_completed_at requires a completion'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db05$;

CREATE TRIGGER db05_progress_first_completion_before_write
BEFORE INSERT OR UPDATE ON learner_content_progress
FOR EACH ROW EXECUTE FUNCTION db05_progress_first_completion_guard();

COMMIT;

-- PROGRESS DELETION SOURCE-PROOF REQUIRED:
-- LearnerContentProgressRepository.countCompletedPerLearner applies
--   (p.is_deleted = 0 OR p.is_deleted IS NULL)
-- AFTER selecting MAX(attempt) across all rows. Do NOT compute MAX(attempt)
-- only among non-deleted rows: that can resurrect an earlier completed attempt.
-- findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc is a separate path
-- that currently does not filter deleted state; reconcile behavior per reader.
-- Consumer/API cutover must implement explicit tombstone visibility, same-
-- college scope, restore policy and negative replay tests before activation.

-- Acceptance proof still required:
--   1) duplicate (membership,content,attempt) -> 23505
--   2) same membership/content attempt 1 and 2 -> success
--   3) first complete -> first_completed_at captured
--   4) clearing completed_at -> first_completed_at unchanged
--   5) changing first_completed_at after first complete -> 23514
--   6) versioned concurrent edit has one winner and one conflict (APP CODE)
--   7) wrong-college membership/content pair rejected by business/DB scope
--   8) clean journal replay, rollback strategy and full DB suite passing
