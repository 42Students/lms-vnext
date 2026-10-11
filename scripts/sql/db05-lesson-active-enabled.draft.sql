-- DB-008 / Chat 6. UNREGISTERED SOURCE-ONLY COMPANION.
-- Separate from the seven independent DB05 drafts; W01 single migration owner.
-- Legacy BE @ 21bad59d4dfaf2fa11fdeaf9353327ce105697d5:
-- Lesson.java: active boolean, enabled boolean, sequence Java long;
-- LessonServiceImpl: on CREATE active/enabled default true if DTO omits;
-- on UPDATE only mutate independently if respective field present.
-- On DELETE legacy is_deleted is separate. On RESTORE only is_deleted reset.
-- VNext course_lessons.status ACTIVE/ARCHIVED does NOT express both flags,
-- and status must remain a separate publication/archival safety gate.
--
-- Existing vNext rows need deliberate API/default/backfill policy before
-- turning on a read filter: nullable staging means UNKNOWN, never assume
-- UNKNOWN=false or silently hide already-existing valid lessons.
BEGIN;

ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS legacy_active boolean,
  ADD COLUMN IF NOT EXISTS legacy_enabled boolean;

COMMIT;

-- NOT EXECUTED:
-- 1. New legacy-equivalent lesson with both flags omitted -> true/true.
-- 2. Update one flag absent => preserve stored value; independently false
--    must not rewrite the other or the vNext status.
-- 3. Learner descendant content visibility enforces lesson active/enabled
--    AND content active/enabled AND publication/ACL, no draft exposure.
-- 4. Restore lesson tombstone does not auto-enable disabled flags or children.
-- 5. Legacy long sequence vs vNext integer requires explicit range decision;
--    no silent truncation or JavaScript Number precision assumptions.
-- 6. Authorize faculty teaching assignment, same college/course/period,
--    test two-user version CAS & tenant-scoped edit concurrently.
-- 7. CLEAN PostgreSQL migration replay, checked main SHA, Node/API tests.
