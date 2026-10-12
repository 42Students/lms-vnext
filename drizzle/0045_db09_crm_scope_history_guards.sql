-- DB017 / W01: DB09 tenant, actor, terminal-followup, immutable history guards.
-- Forward-only after 0044; source docs/planning/sql/db09-tpo-crm-premerge.sql.
-- NOT PostgreSQL-runtime-verified; keep DATABASE phase active.
CREATE FUNCTION db09_assert_lead_scoped_links() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_profile_company uuid;
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles mr ON mr.membership_id = m.id
      JOIN users u ON u.id = m.user_id
     WHERE m.id = NEW.owner_membership_id
       AND m.college_id = NEW.college_id
       AND m.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
  ) THEN
    RAISE EXCEPTION 'lead owner is not active placement staff in lead college'
      USING ERRCODE='23514';
  END IF;

  IF NEW.company_relationship_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM placement_company_relationships r
     WHERE r.id = NEW.company_relationship_id
       AND r.college_id = NEW.college_id
       AND r.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'lead company relationship is not active in lead college'
      USING ERRCODE='23514';
  END IF;

  IF NEW.recruiter_user_id IS NOT NULL THEN
    SELECT p.company_id
      INTO v_profile_company
      FROM placement_recruiter_profiles p
      JOIN placement_companies co ON co.id = p.company_id
      JOIN users u ON u.id = p.user_id
     WHERE p.user_id = NEW.recruiter_user_id
       AND p.status = 'ACTIVE'
       AND co.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE';

    IF v_profile_company IS NULL OR NOT EXISTS (
      SELECT 1
        FROM placement_recruiter_college_grants g
        JOIN placement_company_relationships r
          ON r.id = g.company_relationship_id
       WHERE g.recruiter_user_id = NEW.recruiter_user_id
         AND g.status = 'ACTIVE'
         AND r.status = 'ACTIVE'
         AND r.college_id = NEW.college_id
         AND r.company_id = v_profile_company
         AND (
           NEW.company_relationship_id IS NULL
           OR r.id = NEW.company_relationship_id
         )
    ) THEN
      RAISE EXCEPTION 'joined lead recruiter lacks active same-company college grant'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_lead_scoped_links_guard
  BEFORE INSERT OR UPDATE OF
    college_id,owner_membership_id,company_relationship_id,recruiter_user_id
  ON placement_tpo_leads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_lead_scoped_links();
--> statement-breakpoint
CREATE FUNCTION db09_assert_followup_owner_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles mr ON mr.membership_id = m.id
      JOIN users u ON u.id = m.user_id
     WHERE m.id = NEW.owner_membership_id
       AND m.college_id = NEW.college_id
       AND m.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
  ) THEN
    RAISE EXCEPTION 'follow-up owner is not active placement staff in lead college'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_followup_owner_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,owner_membership_id
  ON placement_tpo_followups
  FOR EACH ROW EXECUTE FUNCTION db09_assert_followup_owner_scope();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_completed_followup_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.done_at IS NOT NULL THEN
    IF NEW.done_at IS NULL THEN
      RAISE EXCEPTION 'completed follow-up cannot become incomplete'
        USING ERRCODE='23514';
    END IF;
    IF NEW.due_at IS DISTINCT FROM OLD.due_at THEN
      RAISE EXCEPTION 'completed follow-up cannot be moved'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_followup_terminal_guard
  BEFORE UPDATE OF due_at,done_at
  ON placement_tpo_followups
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_completed_followup_rewrite();
--> statement-breakpoint
CREATE FUNCTION db09_reject_lead_activity_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'lead activity history is append-only'
    USING ERRCODE='23514';
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_lead_activity_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_lead_activities
  FOR EACH ROW EXECUTE FUNCTION db09_reject_lead_activity_rewrite();
--> statement-breakpoint
CREATE FUNCTION db09_assert_activity_actor_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_system THEN
    IF NEW.created_by_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'system lead activity must not forge a user actor'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.created_by_user_id IS NULL OR NOT EXISTS (
      SELECT 1
        FROM college_memberships m
        JOIN membership_roles mr ON mr.membership_id = m.id
        JOIN users u ON u.id = m.user_id
       WHERE m.user_id = NEW.created_by_user_id
         AND m.college_id = NEW.college_id
         AND m.status = 'ACTIVE'
         AND u.platform_status = 'ACTIVE'
         AND mr.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
    ) THEN
      RAISE EXCEPTION 'lead activity actor is not active placement staff in lead college'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_lead_activity_actor_scope_guard
  BEFORE INSERT ON placement_tpo_lead_activities
  FOR EACH ROW EXECUTE FUNCTION db09_assert_activity_actor_scope();
