-- Chat4 / DB-005: UNREGISTERED, additive to canonical DB02 stage.
-- Role-removal handlers close rows by ended_at or status. Their INSERT/parent
-- validation triggers do not fire for direct SQL reactivation of those fields.
-- A closure must remain valid when the role is already revoked; therefore
-- check CURRENT role and membership ONLY on inactive -> active transitions.

CREATE FUNCTION db02_guard_faculty_assignment_reactivation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status membership_status;
BEGIN
  IF OLD.ended_at IS NULL OR NEW.ended_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT status INTO v_status FROM college_memberships
   WHERE id = NEW.membership_id FOR SHARE;
  IF v_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate faculty assignment without ACTIVE membership'
      USING ERRCODE='23514';
  END IF;
  PERFORM 1 FROM membership_roles
   WHERE membership_id = NEW.membership_id AND role = 'FACULTY' FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate faculty assignment without FACULTY role'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_course_pool_reactivation_role_guard
BEFORE UPDATE OF ended_at ON faculty_course_associations
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation();

CREATE TRIGGER db02_section_faculty_reactivation_role_guard
BEFORE UPDATE OF ended_at ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation();

CREATE TRIGGER db02_teaching_reactivation_role_guard
BEFORE UPDATE OF ended_at ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation();

CREATE FUNCTION db02_guard_learner_program_reactivation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status membership_status;
BEGIN
  IF NEW.status <> 'ACTIVE' OR OLD.status = 'ACTIVE' THEN
    RETURN NEW;
  END IF;
  SELECT status INTO v_status FROM college_memberships
   WHERE id = NEW.membership_id FOR SHARE;
  IF v_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate learner program without ACTIVE membership'
      USING ERRCODE='23514';
  END IF;
  PERFORM 1 FROM membership_roles
   WHERE membership_id = NEW.membership_id AND role = 'LEARNER' FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate learner program without LEARNER role'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_program_enrollment_reactivation_role_guard
BEFORE UPDATE OF status ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_program_reactivation();

CREATE FUNCTION db02_guard_learner_section_reactivation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_program_status learner_program_enrollment_status;
  v_membership uuid;
  v_status membership_status;
BEGIN
  IF NEW.status <> 'ACTIVE' OR OLD.status = 'ACTIVE' THEN
    RETURN NEW;
  END IF;
  SELECT status, membership_id INTO v_program_status, v_membership
    FROM learner_program_enrollments WHERE id = NEW.learner_enrollment_id
    FOR SHARE;
  IF v_program_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate section without ACTIVE learner program'
      USING ERRCODE='23514';
  END IF;
  SELECT status INTO v_status FROM college_memberships
   WHERE id = v_membership FOR SHARE;
  IF v_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate section without ACTIVE college membership'
      USING ERRCODE='23514';
  END IF;
  PERFORM 1 FROM membership_roles
   WHERE membership_id = v_membership AND role = 'LEARNER' FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate section without LEARNER role'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_section_enrollment_reactivation_role_guard
BEFORE UPDATE OF status ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_section_reactivation();

-- Direct enrollment withdrawal/completion previously left ACTIVE child sections.
CREATE FUNCTION db02_close_active_sections_on_program_exit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status <> 'ACTIVE' THEN
    UPDATE section_enrollments
       SET status = CASE WHEN NEW.status = 'COMPLETED' THEN 'COMPLETED'::section_enrollment_status
                         ELSE 'WITHDRAWN'::section_enrollment_status END,
           ended_at = COALESCE(ended_at, statement_timestamp()),
           updated_at = statement_timestamp()
     WHERE learner_enrollment_id = NEW.id AND status = 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_program_exit_close_active_sections
AFTER UPDATE OF status ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_close_active_sections_on_program_exit();

-- NOT executed: Chat1 integrates after canonical stage. Disposable PG must verify
-- role-deletion, membership end, direct status/ended_at reactivation, concurrent
-- status change and role deletion, and positive authorized reactivation.
