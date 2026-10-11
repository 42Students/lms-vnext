-- Chat 6 / DB-008, DATABASE phase only. UNREGISTERED DB05 COMPANION.
-- Not an independent eighth migration; W01 merges into the lesson_contents
-- DB05 schema evolution after legacy producer semantics are accepted.
-- NO PostgreSQL, unit, API or CI execution evidence.
--
-- SOURCE: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- LessonContents.java, LessonContentsDTO.java,
-- LessonContentsServiceImpl.setLessonContents(...):
-- - top-level active and enabled are INDEPENDENT booleans, new content true
--   unless explicitly set, update preserves old if input omitted. Current
--   vNext lesson_contents.status does not prove either Boolean independently.
-- - points is Java long, negative input coerced to 0, not 32-bit int;
--   course_assignments.max_points is NOT synonymous for all content.
-- - deadline is Java LocalDateTime -> timestamp WITHOUT TIME ZONE semantics.
--   incoming null means preserve existing; explicit clearDeadline=true clears.
--   course_assignments.due_at is TIMESTAMPTZ, NOT a safe automatic mapping.
-- - lesson content generic source now rejects ASSIGNMENT; the legacy value
--   is still a persisted historical source field; runtime read/subtype parity
--   and product decision are OPEN. No assignment model cutover here.
--
-- These columns are named legacy_* to avoid falsely implying current runtime
-- behaviour. W01 must reconcile with service changes and not flip features.
BEGIN;

ALTER TABLE lesson_contents
  ADD COLUMN IF NOT EXISTS legacy_active boolean,
  ADD COLUMN IF NOT EXISTS legacy_enabled boolean,
  ADD COLUMN IF NOT EXISTS legacy_points bigint,
  ADD COLUMN IF NOT EXISTS legacy_deadline_local timestamp without time zone;

ALTER TABLE lesson_contents
  ADD CONSTRAINT db05_lesson_contents_legacy_points_nonnegative_ck
    CHECK (legacy_points IS NULL OR legacy_points >= 0);

COMMIT;

-- OPEN acceptance (unexecuted):
--  1. Prove whether all active content formats require both legacy flags
--     before learners see content, and status remains an independent gate.
--  2. Ensure create defaults to active=true, enabled=true; updates omitted
--     flags preserve old values, never implicitly disable a lesson.
--  3. points <= Java long max; negative clamped to 0 by validated producer;
--     direct negative SQL rejects 23514.
--  4. Null deadline on edit means keep; explicit clearDeadline clears;
--     carry LocalDateTime without implicit UTC/offset interpretation.
--  5. Prevent assignment points/deadline mirroring into DB06 max_points/due_at
--     without a verified linked assignment/submission and timezone contract.
--  6. Execute wrong-tenant/unauthorized changes, optimistic concurrency,
--     course/lesson/content reparent, clean PostgreSQL migration replay.
--  7. Existing current app writes/reads do not populate these shadow fields;
--     no feature is approved/ready for production until an API cutover.
