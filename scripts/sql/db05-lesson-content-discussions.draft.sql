-- DB-008 SOURCE-ONLY STAGED DRAFT. NOT A REGISTERED DRIZZLE MIGRATION.
-- Chat 6, 2026-10-11. Chat 1 remains the sole migration integrator.
-- Legacy oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- Legacy sources:
--   DiscussionController POST /api/v1/discussion/post and GET /fetchDiscussion,
--   DiscussionServiceImpl, DiscussionRepository, Discussions, DiscussionDTO,
--   ClassroomController and ClassroomServiceImpl (a DIFFERENT chat feature).
-- vNext: src/db/schema/discussions.ts currently models class/delivery chat,
-- not legacy per-lesson-content discussion messages.
--
-- This is an isolated candidate. Do not execute/register/use it until:
--  1. W01 validates latest schema paths/tenancy and migration order;
--  2. API phase owns a separate lesson discussion read/write service using
--     trusted actor context (never client-supplied author/name/role);
--  3. scope checks, negative tenant writes and concurrent writes are run
--     against disposable PostgreSQL;
--  4. the source-only historical optional columns are investigated.
-- No active vNext API/UI endpoints are added by this draft.

BEGIN;

CREATE TABLE IF NOT EXISTS lesson_content_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Both scope and actor belong to one college; trigger below enforces this.
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  lesson_content_id uuid NOT NULL REFERENCES lesson_contents(id) ON DELETE RESTRICT,
  author_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  -- Legacy names were saved as snapshots by the trusted server, NOT the client.
  author_unique_name_snapshot text,
  author_profile_name_snapshot text,
  content_text text NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  -- Historical physical snapshot has optional fields not handled by current
  -- Discussions.java / DiscussionController. Keep nullable, do not claim
  -- reply/resolution/attachment functionality is active without producer evidence.
  parent_discussion_id uuid,
  discussion_status varchar(20),
  is_faculty_answer boolean,
  resolved_at timestamptz,
  resolved_by_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  attachment_object_key text,
  -- Preserve legacy is_deleted state without hard-deleting/moderation history.
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_content_discussions_text_ck
    CHECK (length(btrim(content_text)) BETWEEN 1 AND 5000),
  CONSTRAINT lesson_content_discussions_parent_not_self_ck
    CHECK (parent_discussion_id IS NULL OR parent_discussion_id <> id),
  CONSTRAINT lesson_content_discussions_id_content_uq
    UNIQUE (id, lesson_content_id),
  -- A reply may never reference a parent from another lesson content.
  CONSTRAINT lesson_content_discussions_parent_content_fk
    FOREIGN KEY (parent_discussion_id, lesson_content_id)
    REFERENCES lesson_content_discussions(id, lesson_content_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS lesson_content_discussions_content_created_idx
  ON lesson_content_discussions (lesson_content_id, created_at, id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS lesson_content_discussions_author_idx
  ON lesson_content_discussions (author_membership_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lesson_content_discussions_parent_idx
  ON lesson_content_discussions (parent_discussion_id)
  WHERE parent_discussion_id IS NOT NULL;

-- Source-backed tenant path in current vNext:
--  lesson_contents -> course_lessons -> course_learning_paths ->
--  course_offerings -> academic_periods.college_id.
-- A plain lesson_content_id FK and author_membership_id FK do NOT prove
-- both rows belong to the same college; this trigger rejects cross-tenant
-- writes even from future privileged/bulk paths that bypass service guards.
CREATE OR REPLACE FUNCTION db05_lesson_discussions_tenant_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_discussion$
DECLARE
  scoped_college_id uuid;
  author_college_id uuid;
  resolver_college_id uuid;
BEGIN
  SELECT ap.college_id INTO scoped_college_id
    FROM lesson_contents lc
    INNER JOIN course_lessons cl ON cl.id = lc.lesson_id
    INNER JOIN course_learning_paths lp ON lp.id = cl.learning_path_id
    INNER JOIN course_offerings co ON co.id = lp.offering_id
    INNER JOIN academic_periods ap ON ap.id = co.academic_period_id
    WHERE lc.id = NEW.lesson_content_id;

  SELECT cm.college_id INTO author_college_id
    FROM college_memberships cm
    WHERE cm.id = NEW.author_membership_id;

  IF scoped_college_id IS NULL
     OR author_college_id IS NULL
     OR scoped_college_id IS DISTINCT FROM NEW.college_id
     OR author_college_id IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'lesson discussion scope violates college boundary'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.resolved_by_membership_id IS NOT NULL THEN
    SELECT cm.college_id INTO resolver_college_id
      FROM college_memberships cm
      WHERE cm.id = NEW.resolved_by_membership_id;

    IF resolver_college_id IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'lesson discussion resolver violates college boundary'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db05_discussion$;

CREATE TRIGGER db05_lesson_discussions_tenant_before_write
BEFORE INSERT OR UPDATE OF college_id, lesson_content_id,
     author_membership_id, resolved_by_membership_id
ON lesson_content_discussions
FOR EACH ROW EXECUTE FUNCTION db05_lesson_discussions_tenant_guard();

COMMIT;

-- Formal acceptance remains OPEN:
--   * current legacy API 5,000 char validator vs historical varchar(255)
--     needs live schema / running API reconciliation (do not count as verified).
--   * Content and author SAME-college accepted; different-college rejected.
--   * Parent from another lesson content rejected (composite FK).
--   * Parent/child same-content accepted only if API confirms active replies.
--   * Missing actor, missing content, cross-college resolver rejected.
--   * Retroactive content/offering/academic-period reassignment must be
--     either prohibited or revalidated (INSERT trigger alone is insufficient).
--   * Acyclic nesting beyond self-replies requires a separate constraint
--     if parent replies are confirmed active; do not expose until proven.
--   * Verify private attachment receipt/ACL; never echo raw private URLs.
--   * Execute clean journal replay and negative/race tests, retain logs/SHA.
