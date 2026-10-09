-- DB03 cross-parent tenant guards: triggers are not modelled by Drizzle snapshots.
CREATE FUNCTION db03_guard_member_tenant() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  owner_scope text;
  group_college uuid;
  membership_college uuid;
  membership_status text;
  user_platform_status text;
BEGIN
  SELECT g.owner_scope, g.college_id INTO owner_scope, group_college
    FROM lms_groups g WHERE g.id = NEW.group_id;
  SELECT m.college_id, m.status::text, u.platform_status::text
    INTO membership_college, membership_status, user_platform_status
    FROM college_memberships m
    JOIN users u ON u.id=m.user_id
    WHERE m.id = NEW.membership_id;
  IF membership_college IS NULL OR membership_status <> 'ACTIVE'
      OR user_platform_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'DB03 group member and user must be active' USING ERRCODE='23514';
  END IF;
  IF owner_scope = 'COLLEGE' AND group_college IS DISTINCT FROM membership_college THEN
    RAISE EXCEPTION 'DB03 group membership college mismatch' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM membership_roles r
      WHERE r.membership_id = NEW.membership_id AND r.role::text = NEW.member_type) THEN
    RAISE EXCEPTION 'DB03 member role mismatch' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
--> statement-breakpoint
CREATE TRIGGER db03_member_tenant_guard
BEFORE INSERT OR UPDATE OF group_id, membership_id, member_type
ON lms_group_members FOR EACH ROW EXECUTE FUNCTION db03_guard_member_tenant();
--> statement-breakpoint
CREATE FUNCTION db03_guard_elective_slot_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE program_college uuid;
DECLARE period_college uuid;
BEGIN
  SELECT d.college_id INTO program_college
    FROM programs p JOIN departments d ON d.id=p.department_id WHERE p.id=NEW.program_id;
  IF program_college IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'DB03 elective slot program college mismatch' USING ERRCODE='23514';
  END IF;
  IF NEW.academic_period_id IS NOT NULL THEN
    SELECT ap.college_id INTO period_college FROM academic_periods ap WHERE ap.id=NEW.academic_period_id;
    IF period_college IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'DB03 elective slot period college mismatch' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
--> statement-breakpoint
CREATE TRIGGER db03_elective_slot_scope_guard
BEFORE INSERT OR UPDATE OF college_id, program_id, academic_period_id
ON elective_slots FOR EACH ROW EXECUTE FUNCTION db03_guard_elective_slot_scope();
--> statement-breakpoint
CREATE FUNCTION db03_guard_elective_offering_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE slot_college uuid;
DECLARE slot_period uuid;
DECLARE group_college uuid;
DECLARE group_kind text;
DECLARE group_owner text;
DECLARE course_college uuid;
DECLARE delivery_course uuid;
DECLARE delivery_period uuid;
DECLARE delivery_cohort uuid;
DECLARE delivery_type text;
DECLARE delivery_status text;
DECLARE section_cohort uuid;
DECLARE section_period uuid;
DECLARE section_status text;
DECLARE delivery_ended timestamptz;
BEGIN
  SELECT college_id, academic_period_id INTO slot_college, slot_period
    FROM elective_slots WHERE id=NEW.slot_id;
  SELECT college_id,kind,owner_scope INTO group_college,group_kind,group_owner
    FROM lms_groups WHERE id=NEW.group_id;
  SELECT d.college_id INTO course_college FROM courses c
    JOIN departments d ON d.id=c.department_id WHERE c.id=NEW.course_id;
  SELECT co.course_id,co.academic_period_id,co.cohort_id,co.type::text,
         co.status::text,s.cohort_id,s.academic_period_id,s.status::text,cd.ended_at
    INTO delivery_course,delivery_period,delivery_cohort,delivery_type,
         delivery_status,section_cohort,section_period,section_status,delivery_ended
    FROM course_section_deliveries cd
    JOIN course_offerings co ON co.id=cd.offering_id
    JOIN sections s ON s.id=cd.section_id
    WHERE cd.id=NEW.backed_delivery_id;
  IF group_college IS DISTINCT FROM slot_college OR group_kind <> 'ELECTIVE'
      OR group_owner <> 'COLLEGE' OR course_college IS DISTINCT FROM slot_college
      OR delivery_course IS DISTINCT FROM NEW.course_id
      OR delivery_type <> 'ELECTIVE' OR delivery_status <> 'ACTIVE'
      OR section_status <> 'ACTIVE' OR delivery_ended IS NOT NULL
      OR delivery_period IS DISTINCT FROM section_period
      OR delivery_cohort IS DISTINCT FROM section_cohort
      OR (slot_period IS NOT NULL AND delivery_period IS DISTINCT FROM slot_period) THEN
    RAISE EXCEPTION 'DB03 elective offering parent scope mismatch' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
--> statement-breakpoint
CREATE TRIGGER db03_elective_offering_scope_guard
BEFORE INSERT OR UPDATE OF slot_id, group_id, course_id, backed_delivery_id
ON elective_offerings FOR EACH ROW EXECUTE FUNCTION db03_guard_elective_offering_scope();
--> statement-breakpoint
CREATE FUNCTION db03_guard_project_team_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE group_college uuid;
DECLARE group_kind text;
DECLARE group_owner text;
BEGIN
  IF NEW.team_group_id IS NULL THEN RETURN NEW; END IF;
  SELECT college_id, kind, owner_scope INTO group_college,group_kind,group_owner
    FROM lms_groups WHERE id=NEW.team_group_id;
  IF group_college IS DISTINCT FROM NEW.college_id OR
     group_kind <> 'PROJECT_TEAM' OR group_owner <> 'COLLEGE' THEN
    RAISE EXCEPTION 'DB03 project TEAM group scope mismatch' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
--> statement-breakpoint
CREATE TRIGGER db03_project_team_scope_guard
BEFORE INSERT OR UPDATE OF team_group_id,college_id ON project_instances
FOR EACH ROW EXECUTE FUNCTION db03_guard_project_team_scope();

--> statement-breakpoint
-- Ownership and purpose are identity, not mutable settings. Changing these
-- after joining people could retroactively defeat tenant/feature boundaries.
CREATE FUNCTION db03_group_owner_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.owner_scope IS DISTINCT FROM OLD.owner_scope
     OR NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'DB03 group kind and owner scope cannot change'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
--> statement-breakpoint
CREATE TRIGGER db03_group_owner_immutable_guard
BEFORE UPDATE OF kind,owner_scope,college_id ON lms_groups
FOR EACH ROW EXECUTE FUNCTION db03_group_owner_immutable();
