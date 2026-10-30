-- DB-014 SOURCE-ONLY CANDIDATE. NOT registered in drizzle/meta/_journal.json.
-- Purpose: close direct-SQL tenant/scope gaps identified by the current-head
-- cross-domain FK sweep. Promotion belongs to the migration integrator after
-- DB-001/DB-002 are unblocked and negative PostgreSQL witnesses can execute.
--
-- This draft intentionally does NOT change the cascade-retention findings for
-- attendance or placement history. Those require an explicit retention policy,
-- because replacing CASCADE with RESTRICT changes product deletion semantics.

-- ---------------------------------------------------------------------------
-- 1. activity_events: couple declared scope + actor membership.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db14_guard_activity_event_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  resolved_organization_id uuid;
  actor_membership_user_id uuid;
  actor_membership_college_id uuid;
  actor_membership_status text;
BEGIN
  IF NEW.college_id IS NOT NULL THEN
    SELECT c.organization_id
      INTO resolved_organization_id
      FROM colleges c
     WHERE c.id = NEW.college_id
     FOR SHARE;

    IF resolved_organization_id IS NULL
       OR NEW.organization_id IS DISTINCT FROM resolved_organization_id THEN
      RAISE EXCEPTION
        'activity event college/organization scope mismatch'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.actor_membership_id IS NOT NULL THEN
    SELECT cm.user_id, cm.college_id, cm.status::text
      INTO actor_membership_user_id, actor_membership_college_id,
           actor_membership_status
      FROM college_memberships cm
     WHERE cm.id = NEW.actor_membership_id
     FOR SHARE;

    IF NEW.college_id IS NULL
       OR actor_membership_user_id IS NULL
       OR actor_membership_status <> 'ACTIVE'
       OR actor_membership_user_id IS DISTINCT FROM NEW.actor_user_id
       OR actor_membership_college_id IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION
        'activity event actor membership scope mismatch'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db14_activity_event_scope_guard
BEFORE INSERT OR UPDATE OF
  organization_id, college_id, actor_user_id, actor_membership_id
ON activity_events
FOR EACH ROW
EXECUTE FUNCTION db14_guard_activity_event_scope();

-- ---------------------------------------------------------------------------
-- 2. in_app_notifications: a scoped event may only be delivered to a currently
-- eligible recipient. This mirrors src/modules/activity/notification-service.ts
-- rather than inventing a narrower rule that would reject recruiter grants.
-- Global events remain unrestricted by tenant scope, matching the service.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db14_guard_notification_recipient_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  event_college_id uuid;
  event_organization_id uuid;
  recipient_active boolean;
  recipient_authorized boolean;
BEGIN
  SELECT ae.college_id, ae.organization_id
    INTO event_college_id, event_organization_id
    FROM activity_events ae
   WHERE ae.id = NEW.event_id
   FOR SHARE;

  SELECT (u.platform_status::text = 'ACTIVE')
    INTO recipient_active
    FROM users u
   WHERE u.id = NEW.user_id
   FOR SHARE;

  IF recipient_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION
      'notification recipient is not an active user'
      USING ERRCODE = '23514';
  END IF;

  IF event_college_id IS NULL AND event_organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  recipient_authorized :=
    EXISTS (
      SELECT 1
        FROM college_memberships cm
        JOIN colleges c ON c.id = cm.college_id
       WHERE cm.user_id = NEW.user_id
         AND cm.status::text = 'ACTIVE'
         AND c.status::text = 'ACTIVE'
         AND (
           (event_college_id IS NOT NULL AND c.id = event_college_id)
           OR
           (
             event_college_id IS NULL
             AND event_organization_id IS NOT NULL
             AND c.organization_id = event_organization_id
           )
         )
       FOR SHARE OF cm, c
    )
    OR EXISTS (
      SELECT 1
        FROM placement_recruiter_college_grants g
        JOIN placement_recruiter_profiles rp
          ON rp.user_id = g.recruiter_user_id
        JOIN placement_company_relationships rel
          ON rel.id = g.company_relationship_id
        JOIN colleges c ON c.id = rel.college_id
       WHERE g.recruiter_user_id = NEW.user_id
         AND g.status::text = 'ACTIVE'
         AND rp.status::text = 'ACTIVE'
         AND rel.status::text = 'ACTIVE'
         AND c.status::text = 'ACTIVE'
         AND (
           (event_college_id IS NOT NULL AND c.id = event_college_id)
           OR
           (
             event_college_id IS NULL
             AND event_organization_id IS NOT NULL
             AND c.organization_id = event_organization_id
           )
         )
       FOR SHARE OF g, rp, rel, c
    )
    OR EXISTS (
      SELECT 1
        FROM system_roles sr
       WHERE sr.user_id = NEW.user_id
         AND sr.role::text = 'SUPER_ADMIN'
       FOR SHARE OF sr
    );

  IF recipient_authorized IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION
      'notification recipient/event scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db14_notification_recipient_scope_guard
BEFORE INSERT OR UPDATE OF user_id, event_id
ON in_app_notifications
FOR EACH ROW
EXECUTE FUNCTION db14_guard_notification_recipient_scope();

-- ---------------------------------------------------------------------------
-- 3. lms_group_member_events: preserve the same college/member-role invariant
-- as current lms_group_members, even when history is inserted directly.
-- Actor scope is checked for college-owned groups; PLATFORM groups remain
-- governed by their existing platform authorization path.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db14_guard_group_member_event_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  group_owner_scope text;
  group_college_id uuid;
  membership_college_id uuid;
  membership_status text;
BEGIN
  SELECT g.owner_scope, g.college_id
    INTO group_owner_scope, group_college_id
    FROM lms_groups g
   WHERE g.id = NEW.group_id
   FOR SHARE;

  SELECT cm.college_id, cm.status::text
    INTO membership_college_id, membership_status
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  IF membership_college_id IS NULL
     OR membership_status <> 'ACTIVE' THEN
    RAISE EXCEPTION
      'group event membership must be active'
      USING ERRCODE = '23514';
  END IF;

  IF group_owner_scope = 'COLLEGE'
     AND group_college_id IS DISTINCT FROM membership_college_id THEN
    RAISE EXCEPTION
      'group event membership college mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role::text = NEW.member_type
     FOR SHARE OF mr
  ) THEN
    RAISE EXCEPTION
      'group event member role mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF (NEW.actor_type = 'SYSTEM') IS DISTINCT FROM (NEW.actor_user_id IS NULL) THEN
    RAISE EXCEPTION
      'group event SYSTEM actor shape mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF group_owner_scope = 'COLLEGE'
     AND NEW.actor_user_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
         FROM college_memberships cm
        WHERE cm.user_id = NEW.actor_user_id
          AND cm.college_id = group_college_id
          AND cm.status::text = 'ACTIVE'
        FOR SHARE OF cm
     )
     AND NOT EXISTS (
       SELECT 1
         FROM system_roles sr
        WHERE sr.user_id = NEW.actor_user_id
          AND sr.role::text = 'SUPER_ADMIN'
        FOR SHARE OF sr
     ) THEN
    RAISE EXCEPTION
      'group event actor outside group college scope'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db14_group_member_event_scope_guard
BEFORE INSERT OR UPDATE OF
  group_id, membership_id, member_type, actor_user_id
ON lms_group_member_events
FOR EACH ROW
EXECUTE FUNCTION db14_guard_group_member_event_scope();

-- Promotion witnesses required:
-- A. activity event with college A + organization B -> 23514.
-- B. activity event with actor membership from college B -> 23514.
-- C. notification to unrelated user for college A event -> 23514.
-- D. same-college member, active recruiter grant, and SUPER_ADMIN recipients pass.
-- E. group member event with membership from another college -> 23514.
-- F. group member event member_type not backed by persisted role -> 23514.
-- G. zero-to-head migration replay + current activity/notification/group suites pass.
