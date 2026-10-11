-- DB-043 DATABASE. STAGING ONLY: NOT a registered Drizzle migration.
-- Chat 1 alone may register this after DB10 shared activity/identity/scope review.
-- Historical oracle: notification (21 fields), 42Students/lms@
-- 21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- This is a NEW greenfield authoring/scheduling model, NOT a legacy-data migration.
--
-- 1) Keep campaigns distinct from delivered in_app_notifications receipts.
-- 2) Do not reuse DB-024 general notification outbox (placement undo/digest).
-- 3) A scheduled campaign is NOT a visible notification before publication.
-- 4) Source event and each per-user receipt are one transaction at publication.
-- 5) Nothing here sends external email/SMS or claims browser/API release parity.

CREATE TABLE notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  source_event_id uuid NOT NULL UNIQUE REFERENCES activity_events(id) ON DELETE RESTRICT,
  creator_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  audience_scope varchar(20) NOT NULL,
  target_section_id uuid REFERENCES sections(id) ON DELETE RESTRICT,
  target_course_id uuid REFERENCES courses(id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  notification_type varchar(20) NOT NULL,
  context_label varchar(255),
  title varchar(240) NOT NULL,
  body text NOT NULL,
  -- Use a safe internal redirect for assessments; NEVER store arbitrary
  -- legacy assessment_url, invitation tokens or bearer URLs in a campaign.
  action_href varchar(1000),
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  scheduled_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  last_failure_code varchar(80),
  publish_attempts integer NOT NULL DEFAULT 0,
  claim_token uuid,
  claim_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0,
  CONSTRAINT db43_campaign_audience_shape_ck CHECK (
    (audience_scope = 'USER' AND target_user_id IS NOT NULL
        AND target_section_id IS NULL AND target_course_id IS NULL)
    OR (audience_scope = 'SECTION' AND target_section_id IS NOT NULL
        AND target_course_id IS NULL AND target_user_id IS NULL)
    OR (audience_scope = 'COURSE' AND target_course_id IS NOT NULL
        AND target_section_id IS NULL AND target_user_id IS NULL)
    OR (audience_scope = 'SECTION_COURSE' AND target_section_id IS NOT NULL
        AND target_course_id IS NOT NULL AND target_user_id IS NULL)
  ),
  CONSTRAINT db43_campaign_type_ck CHECK (notification_type IN ('GENERAL','JOB','COURSE','SYSTEM')),
  CONSTRAINT db43_campaign_content_ck CHECK (
    length(btrim(title)) BETWEEN 1 AND 240
    AND length(btrim(body)) BETWEEN 1 AND 50000
    AND (context_label IS NULL OR length(btrim(context_label)) BETWEEN 1 AND 255)
  ),
  CONSTRAINT db43_campaign_action_ck CHECK (
    action_href IS NULL OR
    (action_href LIKE '/%' AND action_href NOT LIKE '//%'
      AND position(chr(92) in action_href) = 0 AND length(action_href) <= 1000)
  ),
  CONSTRAINT db43_campaign_state_ck CHECK (
    status IN ('DRAFT','SCHEDULED','PUBLISHING','PUBLISHED','FAILED','CANCELLED')
    AND (status <> 'SCHEDULED' OR scheduled_at IS NOT NULL)
    AND (status <> 'PUBLISHED' OR (published_at IS NOT NULL AND claim_token IS NULL AND claim_expires_at IS NULL))
    AND (status = 'PUBLISHED' OR published_at IS NULL)
    AND (status <> 'PUBLISHING' OR (claim_token IS NOT NULL AND claim_expires_at IS NOT NULL))
    AND (status = 'PUBLISHING' OR (claim_token IS NULL AND claim_expires_at IS NULL))
    AND (status <> 'FAILED' OR last_failure_code IS NOT NULL)
  ),
  CONSTRAINT db43_campaign_attempts_ck CHECK (publish_attempts >= 0 AND version >= 0)
);

CREATE INDEX db43_campaign_due_idx ON notification_campaigns
  (scheduled_at, id)
  WHERE status IN ('SCHEDULED','FAILED') AND archived_at IS NULL;
CREATE INDEX db43_campaign_tenant_created_idx
  ON notification_campaigns (college_id, created_at DESC, id DESC);
CREATE INDEX db43_campaign_creator_idx
  ON notification_campaigns (creator_membership_id, created_at DESC);

CREATE FUNCTION db43_guard_campaign_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  actual_org uuid;
  event_org uuid;
  event_college uuid;
  section_college uuid;
  course_college uuid;
  creator_college uuid;
BEGIN
  SELECT c.organization_id INTO actual_org FROM colleges c
   WHERE c.id = NEW.college_id FOR SHARE;
  IF actual_org IS NULL OR actual_org <> NEW.organization_id THEN
    RAISE EXCEPTION 'Notification campaign organization/college mismatch'
      USING ERRCODE='23514';
  END IF;

  SELECT e.organization_id, e.college_id
    INTO event_org, event_college
    FROM activity_events e WHERE e.id=NEW.source_event_id FOR SHARE;
  IF event_college IS DISTINCT FROM NEW.college_id
     OR event_org IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Notification campaign source-event scope mismatch'
      USING ERRCODE='23514';
  END IF;

  IF NEW.creator_membership_id IS NOT NULL THEN
    SELECT m.college_id INTO creator_college
      FROM college_memberships m
     WHERE m.id=NEW.creator_membership_id AND m.status='ACTIVE'
     FOR SHARE;
    IF creator_college IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'Notification campaign creator is not active in college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.target_section_id IS NOT NULL THEN
    SELECT d.college_id INTO section_college
      FROM sections s
      JOIN cohorts h ON h.id=s.cohort_id
      JOIN programs p ON p.id=h.program_id
      JOIN departments d ON d.id=p.department_id
     WHERE s.id=NEW.target_section_id FOR SHARE OF s, h, p, d;
    IF section_college IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'Notification campaign section is outside college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.target_course_id IS NOT NULL THEN
    SELECT d.college_id INTO course_college
      FROM courses c
      JOIN departments d ON d.id=c.department_id
     WHERE c.id=NEW.target_course_id FOR SHARE OF c, d;
    IF course_college IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'Notification campaign course is outside college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.audience_scope='SECTION_COURSE' THEN
    -- No cross-section/cross-program broadcast by combining unrelated IDs.
    IF NOT EXISTS (
      SELECT 1
      FROM course_section_deliveries cd
      JOIN course_offerings o ON o.id=cd.offering_id
      WHERE cd.section_id=NEW.target_section_id
        AND o.course_id=NEW.target_course_id
        AND cd.ended_at IS NULL AND o.status='ACTIVE'
    ) THEN
      RAISE EXCEPTION 'Campaign section and course have no active delivery'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.target_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM college_memberships m
     WHERE m.user_id=NEW.target_user_id
       AND m.college_id=NEW.college_id
       AND m.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Campaign personal recipient is not active in college'
      USING ERRCODE='23514';
  END IF;

  -- Scheduling is not publication. An immediate campaign may have NULL
  -- scheduled_at, but it MUST be projected to receipts before PUBLISHED.
  RETURN NEW;
END;
$$;

CREATE TRIGGER db43_notification_campaign_scope_guard
BEFORE INSERT OR UPDATE OF organization_id, college_id, source_event_id,
  creator_membership_id, audience_scope, target_section_id, target_course_id,
  target_user_id
ON notification_campaigns FOR EACH ROW
EXECUTE FUNCTION db43_guard_campaign_scope();

-- INTEGRATION RULES, intentionally NOT faked by an SQL side effect:
-- * Service inserts the activity event and campaign in one transaction.
-- * Due releases SELECT ... FOR UPDATE SKIP LOCKED with a fenced claim.
-- * Re-evaluate active target learner/faculty/mentor college and course/
--   section access after claiming and before publishing.
-- * Publisher transaction inserts in_app_notifications per authorized user,
--   using UNIQUE(user_id,event_id) ON CONFLICT DO NOTHING; then sets status
--   PUBLISHED/published_at and clears claim in the SAME transaction.
-- * Only published in_app_notifications are visible to recipient list/read.
-- * No shared is_read boolean; mark read per user receipt.
-- * Producer/recipient authorization, archived ancestor reparenting races,
--   late recipient changes and safe internal actionHref require executable
--   negative/concurrency witnesses on disposable PostgreSQL.
-- * No provider handoff is implied by status='PUBLISHED'.
