-- DB-008 / CHAT 6: tombstone mutation optimistic-version invariant.
-- UNREGISTERED SOURCE-ONLY COMPANION. NOT a standalone numbered migration.
-- W01 owns ordering/registration. NEVER execute on a live database as-is.
--
-- PRECONDITIONS: W01 must already have installed:
--  A. scripts/sql/db05-version-progress-attempts.draft.sql
--     -> courses.version, course_lessons.version, lesson_contents.version BIGINT.
--  B. scripts/sql/db05-course-soft-delete-guard.draft.sql
--     -> courses.legacy_deleted_at.
--  C. scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql
--     -> course_lessons and lesson_contents legacy_deleted_at.
-- Application writers must simultaneously implement WHERE id AND version
-- compare-and-swap and must exclude existing tombstones on protected edits.
--
-- CRITICAL: A direct legacy_deleted_at UPDATE could previously change the
-- record's lifecycle without changing optimistic version. A stale writer that
-- had loaded version N could then pass a WHERE id AND version=N predicate and
-- overwrite state after deletion/restore. This BEFORE trigger makes EVERY
-- actual tombstone transition invalidate stale versions. If the API already
-- increments by exactly 1, the trigger accepts and does not increment again.
-- A no-op repeated tombstone update does not change version automatically.
-- Other (non-tombstone) edits remain the API CAS writer's responsibility.
BEGIN;

CREATE OR REPLACE FUNCTION db05_tombstone_version_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_tombstone_version$
BEGIN
  IF OLD.legacy_deleted_at IS NOT DISTINCT FROM NEW.legacy_deleted_at THEN
    RETURN NEW;
  END IF;

  IF OLD.version IS NULL OR NEW.version IS NULL THEN
    RAISE EXCEPTION 'tombstone mutation requires non-null optimistic version'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.version = OLD.version THEN
    -- Preserve CAS behavior even when a direct SQL/legacy delete path did not
    -- explicitly increment version. Postgres row UPDATE lock serializes this
    -- with a concurrent CAS mutation on the same row.
    NEW.version := OLD.version + 1;
  ELSIF NEW.version = OLD.version + 1 THEN
    -- Already bumped once by an API CAS writer or lesson child cascade.
    NULL;
  ELSE
    RAISE EXCEPTION 'tombstone mutation must advance optimistic version once'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_tombstone_version$;

-- Trigger columns are scoped deliberately: do not treat publication/status
-- changes as deletion, and do not inflate the version on unrelated updates.
CREATE TRIGGER db05_courses_tombstone_version_before_update
BEFORE UPDATE OF legacy_deleted_at ON courses
FOR EACH ROW EXECUTE FUNCTION db05_tombstone_version_guard();

CREATE TRIGGER db05_course_lessons_tombstone_version_before_update
BEFORE UPDATE OF legacy_deleted_at ON course_lessons
FOR EACH ROW EXECUTE FUNCTION db05_tombstone_version_guard();

CREATE TRIGGER db05_lesson_contents_tombstone_version_before_update
BEFORE UPDATE OF legacy_deleted_at ON lesson_contents
FOR EACH ROW EXECUTE FUNCTION db05_tombstone_version_guard();

COMMIT;

-- MANDATORY DISPOSABLE POSTGRES NEGATIVE MATRIX (UNEXECUTED):
-- TV-01 Active row version=3 -> delete without explicit bump => version=4.
-- TV-02 Active version=3 -> delete with supplied version=4 => stays 4.
-- TV-03 Active version=3 -> delete with supplied version=6 => 23514.
-- TV-04 Tombstoned version=4 -> repeated same timestamp => version remains 4.
-- TV-05 Tombstoned version=4 -> restore to NULL without bump => version=5.
-- TV-06 Restore with API version=5 => stays 5 (not 6).
-- TV-07 Soft delete lesson; newly deleted children bump once, previously
--       deleted child keeps tombstone and version unchanged.
-- TV-08 Stale content writer WHERE id AND version=3 after TV-01 => 0 rows.
-- TV-09 Two sessions CAS update vs tombstone on same row serialize safely,
--       no lost delete; verify SQLSTATE and service retry/backoff behavior.
-- TV-10 Non-tombstone status edit does not auto-bump (app CAS required).
-- TV-11 Failed concurrent child cascade rolls back parent tombstone and all
--       children atomically. New rows may not attach to deleted ancestors.
-- TV-12 Order of registered migration dependencies enforced; install without
--       version/tombstone columns must be refused, no production drift.
-- TV-13 Overflow/large version boundary produces safe failure.
-- TV-14 Per-tenant authorization and same-college read/restore visibility
--       remain enforced by application even when SQL trigger succeeds.
--
-- Running authored tests, clean PG replay, role/tenant regression, and exact
-- SHA evidence are NOT supplied by this unregistered source draft.
