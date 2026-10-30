-- DB-008 / Chat 6 source-based COURSE IDENTITY draft, NOT a registered migration.
-- W01 must integrate only after current vNext service changes and DB acceptance.
-- Legacy backend oracle: 21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- References:
--  Course.java: short_title, slug globally unique (64 chars), course_name.
--  CourseDTO.java: shortTitle @NotBlank(max 255), courseName required.
--  CourseRepository.java: existsBySlug checks ALL rows (even soft-deleted);
--    findBySlug resolves only non-deleted; deleted slug remains permanently reserved.
--  V131__course_lesson_unique_names.sql: unique LOWER(TRIM(short_title))
--    per department for non-deleted rows and LOWER(TRIM(course_name)).
-- Current vNext courses.ts has name, code, status, but no short_title/slug.
--
-- PRECONDITIONS:
-- * Short title is user-authored, not equivalent to courses.code or courses.name.
-- * Service must generate or validate globally unique slug before publishing
--   routes and use slug-only for URLs (not the canonical course code).
-- * Audit current vNext rows for blank/duplicate trimmed names before indexes.
-- * Preserve slug after ARCHIVED: never recycle public identifiers.
-- * This staged migration adds nullable columns only; required-field semantics
--   must be enabled atomically with updated course creation and seed flows.
-- * Do not infer parent_course_id or active/enabled/allowed_for_display
--   equivalence from this draft. Those remain OPEN source-contract decisions.
-- * W01 solely registers Drizzle migrations after real PostgreSQL evidence.

BEGIN;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS short_title varchar(255),
  ADD COLUMN IF NOT EXISTS slug varchar(64);

-- The named guards are already installed by registered migration 0310.
-- Keep the draft independently replayable without dropping or weakening a guard.
DO $db05$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'courses'::regclass
      AND conname = 'db05_course_short_title_nonblank_ck'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT db05_course_short_title_nonblank_ck
      CHECK (short_title IS NULL OR length(btrim(short_title)) > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'courses'::regclass
      AND conname = 'db05_course_slug_nonblank_ck'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT db05_course_slug_nonblank_ck
      CHECK (slug IS NULL OR length(btrim(slug)) > 0);
  END IF;
END $db05$;

-- Legacy slug reservation is GLOBAL, including archived/soft-deleted rows.
CREATE UNIQUE INDEX IF NOT EXISTS db05_course_slug_reserved_uq
  ON courses (slug)
  WHERE slug IS NOT NULL;

-- Active course and short-title uniqueness use LOWER(TRIM). These remain
-- partial on ACTIVE rows only; archived courses can reuse a visible title,
-- but their immutable/public slug is still reserved forever.
CREATE UNIQUE INDEX IF NOT EXISTS db05_course_active_department_short_title_trim_uq
  ON courses (department_id, lower(btrim(short_title)))
  WHERE status = 'ACTIVE' AND deleted_at IS NULL AND short_title IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS db05_course_active_department_name_trim_uq
  ON courses (department_id, lower(btrim(name)))
  WHERE status = 'ACTIVE' AND deleted_at IS NULL;

COMMIT;

-- UNEXECUTED acceptance list:
-- 1. Two active courses in one department differing only in whitespace/case
--    collide on name/short title; different departments may reuse titles.
-- 2. Archived course's title may be reused by new active row; existing slug
--    may NOT be reused while archive still holds it.
-- 3. Created course short title/slug required by API after coordinated cutover;
--    existing seeded rows must be migrated/validated first.
-- 4. Duplicate slug writes conflict; generated and client-provided slug paths
--    have correct validation, retries and friendly errors.
-- 5. Legacy route slug resolver keeps tenant/role read authorization.
-- 6. Clean DB migration replay, contention tests and rollback proof pass.
