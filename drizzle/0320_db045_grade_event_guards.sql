-- DB045 first registered grade-history hardening slice. 0205 already owns
-- assignment_grade_events; NEVER duplicate CREATE TABLE or rewrite 0205.
-- This protects grade history and enforces tenant/actor scope. Deferred
-- grade completeness and attendance producer cutover remain separate gates.
CREATE FUNCTION db06_grade_event_scope_guard()
RETURNS trigger LANGUAGE plpgsql AS $db06_grade_scope$
DECLARE
  submission_college uuid;
  learner_college uuid;
  actor_college uuid;
  actor_user uuid;
BEGIN
  SELECT section_dep.college_id
    INTO submission_college
    FROM assignment_submissions s
    JOIN course_section_deliveries d ON d.id = s.delivery_id
    JOIN sections sec ON sec.id = d.section_id
    JOIN cohorts c ON c.id = sec.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments section_dep ON section_dep.id = p.department_id
    WHERE s.id = NEW.assignment_submission_id
      AND s.assignment_id = NEW.assignment_id
      AND s.delivery_id = NEW.delivery_id
      AND s.membership_id = NEW.learner_membership_id
    FOR SHARE OF s, d, sec, c, p, section_dep;

  SELECT college_id INTO learner_college
    FROM college_memberships
    WHERE id = NEW.learner_membership_id
    FOR SHARE;

  IF submission_college IS NULL
     OR NEW.college_id IS DISTINCT FROM submission_college
     OR learner_college IS DISTINCT FROM submission_college THEN
    RAISE EXCEPTION 'DB06 grade event submission/learner tenant mismatch'
      USING ERRCODE='23514';
  END IF;

  IF NEW.actor_membership_id IS NOT NULL THEN
    SELECT college_id, user_id
      INTO actor_college, actor_user
      FROM college_memberships
      WHERE id = NEW.actor_membership_id
        AND status = 'ACTIVE'
      FOR SHARE;
    IF actor_college IS DISTINCT FROM submission_college
       OR actor_user IS DISTINCT FROM NEW.actor_user_id THEN
      RAISE EXCEPTION 'DB06 grade event actor membership mismatch'
        USING ERRCODE='23514';
    END IF;

    -- The persisted actor_role is an asserted, checked role, not merely
    -- a descriptive label. A Faculty must not impersonate COLLEGE_ADMIN when
    -- its membership happens to carry some other grant.
    IF NEW.actor_role = 'COLLEGE_ADMIN' THEN
      PERFORM 1 FROM membership_roles mr
        WHERE mr.membership_id = NEW.actor_membership_id
          AND mr.role = 'COLLEGE_ADMIN'
        FOR SHARE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'DB06 grade event actor role lacks COLLEGE_ADMIN grant'
          USING ERRCODE='23514';
      END IF;
    ELSIF NEW.actor_role = 'FACULTY' THEN
      PERFORM 1 FROM membership_roles mr
        JOIN course_teaching_assignments cta
          ON cta.membership_id = mr.membership_id
         AND cta.delivery_id = NEW.delivery_id
         AND cta.ended_at IS NULL
        WHERE mr.membership_id = NEW.actor_membership_id
          AND mr.role = 'FACULTY'
        FOR SHARE OF mr, cta;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'DB06 grade event actor lacks grading scope'
          USING ERRCODE='23514';
      END IF;
    ELSE
      RAISE EXCEPTION 'DB06 grade event tenant actor role invalid'
        USING ERRCODE='23514';
    END IF;
  ELSE
    PERFORM 1
      FROM system_roles
      WHERE user_id = NEW.actor_user_id
        AND role = 'SUPER_ADMIN'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 tenant grade event requires actor membership'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db06_grade_scope$;
CREATE TRIGGER db06_grade_event_scope_guard
BEFORE INSERT ON assignment_grade_events
FOR EACH ROW EXECUTE FUNCTION db06_grade_event_scope_guard();

CREATE FUNCTION db06_reject_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $db06_immutable$
BEGIN
  RAISE EXCEPTION 'DB06 history is append-only' USING ERRCODE='23514';
END;
$db06_immutable$;

CREATE TRIGGER db06_grade_events_no_mutation
BEFORE UPDATE OR DELETE ON assignment_grade_events
FOR EACH ROW EXECUTE FUNCTION db06_reject_history_mutation();

CREATE TRIGGER db06_grade_events_no_truncate
BEFORE TRUNCATE ON assignment_grade_events
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_history_mutation();
