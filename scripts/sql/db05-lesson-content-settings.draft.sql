-- DB-008 SOURCE-BACKED STAGED ONLY. NOT A REGISTERED MIGRATION.
-- Legacy backend oracle 21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- Sources: ContentDataDTO.java, LessonContents.java, V163 retirement of old
-- content types; see docs/planning/db05-lesson-content-payload-subfields.json.
--
-- Current vNext lesson_contents has title/notes/url/storage, duration and
-- start/end timestamps but not the source discussion/schedule gates,
-- HTML/text presentation, event reference/timezone or independent thumbnail.
-- This additive proposed one-to-one table DOES NOT enable those features.
-- W01 alone registers migrations; consumer/API phase must prove semantics,
-- safe URL/HTML validation, wrong-tenant access and date/timezone behavior.
BEGIN;

CREATE TABLE IF NOT EXISTS lesson_content_settings (
  lesson_content_id uuid PRIMARY KEY
    REFERENCES lesson_contents(id) ON DELETE RESTRICT,
  allow_discussions boolean NOT NULL DEFAULT false,
  view_after_schedule boolean NOT NULL DEFAULT false,
  view_before_schedule boolean NOT NULL DEFAULT false,
  html_content text,
  plain_text text,
  -- The legacy source is a String; not an authoritative assignment dueAt.
  legacy_due_date_raw text,
  calendar_event_id text,
  calendar_time_zone text,
  thumbnail_url text,
  version bigint NOT NULL DEFAULT 0,
  updated_by_user_id uuid NOT NULL
    REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db05_lesson_content_settings_version_nonnegative_ck
    CHECK (version >= 0)
);

CREATE INDEX IF NOT EXISTS db05_lesson_content_settings_updated_idx
  ON lesson_content_settings (updated_at DESC);

COMMIT;

-- Mandatory NOT EXECUTED acceptance:
--  1. Confirm flags' visible semantics for all active content subtypes;
--     do not make view_after_schedule and view_before_schedule exclusive
--     without current legacy source evidence.
--  2. HTML sanitizer, private FILE/LINK materials and calendar URL safety.
--  3. Calendar timezone: current vNext starts_at/ends_at TIMESTAMPTZ
--     and legacy startTime/endTime Strings cannot be silently equated.
--  4. DB06 assignmentResources and allowedSubmissionTypes remain unmapped;
--     no raw JSON payload should bypass file receipt/privacy checks.
--  5. Cross-tenant content owner/schedule edit negative PostgreSQL tests.
--  6. Version compare-and-swap on updates; direct UPDATE without
--     expected version still risks lost writes.
--  7. W01 registers after full source contract and migration journal replay.
