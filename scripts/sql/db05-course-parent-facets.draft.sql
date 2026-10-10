-- DB-008 SOURCE-BACKED DRAFT -- NOT A REGISTERED MIGRATION.
-- Legacy BE: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- Course.java + CourseDTO + CourseServiceImpl.setCourseFields:
--   parent_course_id: boxed payload NULL=leave unchanged, 0=clear -> NULL
--   created_by_org_id: nullable organization attribution
--   active, enabled: independent nullable state flags
--   allowed_for_display: nullable INTEGER, usage/meaning NOT YET PROVEN
-- These are NOT interchangeable with the vNext courses.status enum.
-- 
-- Historical SQL snapshot has default_subscription_days and formal_title,
-- but current Course.java/CourseDTO did not expose those. Do NOT add until
-- producer/consumer status is established, or scope-retire explicitly.
--
-- NOTICE: FK alone does NOT protect against parent cycles, cross-college
-- relation mismatches, or changing the owning department/organization. 
-- W01 must decide and prove invariants BEFORE registering/enabling writes.
--
-- Existing W01-owned journal/schema barrel remain untouched.
BEGIN;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS parent_course_id uuid
    REFERENCES courses(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS created_by_organization_id uuid
    REFERENCES organizations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS legacy_active boolean,
  ADD COLUMN IF NOT EXISTS legacy_enabled boolean,
  ADD COLUMN IF NOT EXISTS allowed_for_display integer;

ALTER TABLE courses
  ADD CONSTRAINT db05_course_parent_not_self_ck
    CHECK (parent_course_id IS NULL OR parent_course_id <> id);

CREATE INDEX IF NOT EXISTS db05_course_parent_idx
  ON courses (parent_course_id) WHERE parent_course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS db05_course_author_organization_idx
  ON courses (created_by_organization_id)
  WHERE created_by_organization_id IS NOT NULL;

COMMIT;

-- Unexecuted gate:
--  1. Create and update must distinguish absent/null payload vs explicit
--     clear-parent command, without allowing untrusted organization spoofing.
--  2. Prevent direct/indirect parent cycles; same tenant/college policy must
--     be source-verified and applied on BOTH parent and department moves.
--  3. Source-confirm values and actual consumers of allowed_for_display.
--  4. active/enabled/status/soft-delete transitions preserve distinct reads.
--  5. PostgreSQL wrong-parent-tenant, cycle, concurrent reassignment tests.
--  6. W01 sequential migration replay and schema export/typecheck proof.
