-- DB-079 / W01: forward-only hardening after
-- 0045_db09_crm_scope_history_guards.
--
-- Goals:
-- 1) existing invalid CRM rows fail closed before replacing guards;
-- 2) accepted owner/recruiter/activity principals are SHARE-locked until commit,
--    so concurrent membership/company/grant revocation cannot race validation;
-- 3) lead activity append-only history rejects TRUNCATE as well as UPDATE/DELETE.
--
-- No data repair is performed.

DO $db09_crm_race_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM placement_tpo_leads l
    WHERE l.owner_membership_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM college_memberships m
        JOIN membership_roles mr ON mr.membership_id = m.id
        JOIN users u ON u.id = m.user_id
        WHERE m.id = l.owner_membership_id
          AND m.college_id = l.college_id
          AND m.status = 'ACTIVE'
          AND u.platform_status = 'ACTIVE'
          AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
      )
  ) THEN
    RAISE EXCEPTION 'DB09 CRM preflight: invalid lead owner principal'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM placement_tpo_leads l
    WHERE l.company_relationship_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM placement_company_relationships r
        WHERE r.id = l.company_relationship_id
          AND r.college_id = l.college_id
          AND r.status = 'ACTIVE'
      )
  ) THEN
    RAISE EXCEPTION 'DB09 CRM preflight: invalid lead company relationship'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM placement_tpo_leads l
    WHERE l.recruiter_user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM placement_recruiter_profiles p
        JOIN placement_companies co
          ON co.id = p.company_id
         AND co.status = 'ACTIVE'
        JOIN users u
          ON u.id = p.user_id
         AND u.platform_status = 'ACTIVE'
        JOIN placement_recruiter_college_grants g
          ON g.recruiter_user_id = p.user_id
         AND g.status = 'ACTIVE'
        JOIN placement_company_relationships r
          ON r.id = g.company_relationship_id
         AND r.status = 'ACTIVE'
         AND r.company_id = p.company_id
         AND r.college_id = l.college_id
        WHERE p.user_id = l.recruiter_user_id
          AND p.status = 'ACTIVE'
          AND (
            l.company_relationship_id IS NULL
            OR r.id = l.company_relationship_id
          )
      )
  ) THEN
    RAISE EXCEPTION 'DB09 CRM preflight: joined recruiter lacks valid same-company grant'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM placement_tpo_followups f
    WHERE f.owner_membership_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM college_memberships m
        JOIN membership_roles mr ON mr.membership_id = m.id
        JOIN users u ON u.id = m.user_id
        WHERE m.id = f.owner_membership_id
          AND m.college_id = f.college_id
          AND m.status = 'ACTIVE'
          AND u.platform_status = 'ACTIVE'
          AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
      )
  ) THEN
    RAISE EXCEPTION 'DB09 CRM preflight: invalid follow-up owner principal'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM placement_tpo_lead_activities a
    WHERE
      (a.is_system AND a.created_by_user_id IS NOT NULL)
      OR
      (
        NOT a.is_system
        AND (
          a.created_by_user_id IS NULL
          OR NOT EXISTS (
            SELECT 1
            FROM college_memberships m
            JOIN membership_roles mr ON mr.membership_id = m.id
            JOIN users u ON u.id = m.user_id
            WHERE m.user_id = a.created_by_user_id
              AND m.college_id = a.college_id
              AND m.status = 'ACTIVE'
              AND u.platform_status = 'ACTIVE'
              AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'DB09 CRM preflight: invalid lead activity actor principal'
      USING ERRCODE='23514';
  END IF;
END;
$db09_crm_race_preflight$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db09_assert_lead_scoped_links()
RETURNS trigger LANGUAGE plpgsql AS $db09_lead_scope$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL THEN
    PERFORM 1
    FROM college_memberships m
    JOIN membership_roles mr ON mr.membership_id = m.id
    JOIN users u ON u.id = m.user_id
    WHERE m.id = NEW.owner_membership_id
      AND m.college_id = NEW.college_id
      AND m.status = 'ACTIVE'
      AND u.platform_status = 'ACTIVE'
      AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
    LIMIT 1
    FOR SHARE OF m, mr, u;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'lead owner is not active placement staff in lead college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.company_relationship_id IS NOT NULL THEN
    PERFORM 1
    FROM placement_company_relationships r
    WHERE r.id = NEW.company_relationship_id
      AND r.college_id = NEW.college_id
      AND r.status = 'ACTIVE'
    FOR SHARE OF r;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'lead company relationship is not active in lead college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF NEW.recruiter_user_id IS NOT NULL THEN
    PERFORM 1
    FROM placement_recruiter_profiles p
    JOIN placement_companies co
      ON co.id = p.company_id
     AND co.status = 'ACTIVE'
    JOIN users u
      ON u.id = p.user_id
     AND u.platform_status = 'ACTIVE'
    JOIN placement_recruiter_college_grants g
      ON g.recruiter_user_id = p.user_id
     AND g.status = 'ACTIVE'
    JOIN placement_company_relationships r
      ON r.id = g.company_relationship_id
     AND r.status = 'ACTIVE'
     AND r.company_id = p.company_id
     AND r.college_id = NEW.college_id
    WHERE p.user_id = NEW.recruiter_user_id
      AND p.status = 'ACTIVE'
      AND (
        NEW.company_relationship_id IS NULL
        OR r.id = NEW.company_relationship_id
      )
    FOR SHARE OF p, co, u, g, r;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'joined lead recruiter lacks active same-company college grant'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db09_lead_scope$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db09_assert_followup_owner_scope()
RETURNS trigger LANGUAGE plpgsql AS $db09_followup_scope$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL THEN
    PERFORM 1
    FROM college_memberships m
    JOIN membership_roles mr ON mr.membership_id = m.id
    JOIN users u ON u.id = m.user_id
    WHERE m.id = NEW.owner_membership_id
      AND m.college_id = NEW.college_id
      AND m.status = 'ACTIVE'
      AND u.platform_status = 'ACTIVE'
      AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
    LIMIT 1
    FOR SHARE OF m, mr, u;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'follow-up owner is not active placement staff in lead college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db09_followup_scope$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db09_assert_activity_actor_scope()
RETURNS trigger LANGUAGE plpgsql AS $db09_activity_scope$
BEGIN
  IF NEW.is_system THEN
    IF NEW.created_by_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'system lead activity must not forge a user actor'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.created_by_user_id IS NULL THEN
      RAISE EXCEPTION 'lead activity actor is not active placement staff in lead college'
        USING ERRCODE='23514';
    END IF;

    PERFORM 1
    FROM college_memberships m
    JOIN membership_roles mr ON mr.membership_id = m.id
    JOIN users u ON u.id = m.user_id
    WHERE m.user_id = NEW.created_by_user_id
      AND m.college_id = NEW.college_id
      AND m.status = 'ACTIVE'
      AND u.platform_status = 'ACTIVE'
      AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
    LIMIT 1
    FOR SHARE OF m, mr, u;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'lead activity actor is not active placement staff in lead college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db09_activity_scope$;
--> statement-breakpoint

CREATE TRIGGER db09_lead_activity_no_truncate
BEFORE TRUNCATE ON placement_tpo_lead_activities
FOR EACH STATEMENT EXECUTE FUNCTION db09_reject_lead_activity_rewrite();
