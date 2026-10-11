-- DB-030 / DB06 assessment relational-integrity hardening.
-- Forward-only follow-up to 0041_db06_assessment_parent_scope.
-- Trigger/function only: no Drizzle table shape changes.
--
-- 0041 installed the first same-offering/exact-delivery/history guards. This
-- migration closes four review findings without rewriting 0041 history:
-- 1) elective-backed deliveries use the DB03 elective roster and never the
--    host section as an access fallback;
-- 2) quiz-attempt / assignment-submission attribution is immutable history;
-- 3) assignment max_points cannot be lowered beneath persisted grades;
-- 4) newly persisted grading actors must currently be authorized for delivery.
--
-- Grade publication remains service-authorized because the current persistence
-- row stores no publisher actor. Row-level SQL also cannot authenticate which
-- human/session supplied an otherwise-authorized graded_by_user_id.

DO $db06_hardening_preflight$
DECLARE
  bad_count bigint;
BEGIN
  SELECT count(*) INTO bad_count
  FROM (
    SELECT membership_id, delivery_id FROM quiz_attempts
    UNION ALL
    SELECT membership_id, delivery_id FROM assignment_submissions
  ) history
  JOIN college_memberships cm ON cm.id = history.membership_id
  JOIN course_section_deliveries d ON d.id = history.delivery_id
  JOIN course_offerings co ON co.id = d.offering_id
  JOIN courses c ON c.id = co.course_id
  JOIN departments cdep ON cdep.id = c.department_id
  JOIN sections s ON s.id = d.section_id
  JOIN cohorts sc ON sc.id = s.cohort_id
  JOIN programs sp ON sp.id = sc.program_id
  JOIN departments sdep ON sdep.id = sp.department_id
  WHERE cm.college_id IS DISTINCT FROM cdep.college_id
     OR cm.college_id IS DISTINCT FROM sdep.college_id
     OR cdep.college_id IS DISTINCT FROM sdep.college_id;

  IF bad_count > 0 THEN
    RAISE EXCEPTION
      'DB06 hardening preflight: % historical assessment learner rows cross college scope',
      bad_count
      USING ERRCODE='23514';
  END IF;
END;
$db06_hardening_preflight$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db06_guard_assessment_definition()
RETURNS trigger LANGUAGE plpgsql AS $db06_definition$
DECLARE
  lesson_offering uuid;
  delivery_offering uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'course_quizzes'
       AND EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = OLD.id)
       AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
         OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
      RAISE EXCEPTION 'Quiz with attempts cannot change lesson/delivery'
        USING ERRCODE='23514';
    END IF;

    IF TG_TABLE_NAME = 'course_assignments' THEN
      IF EXISTS (
           SELECT 1 FROM assignment_submissions s
           WHERE s.assignment_id = OLD.id
         )
         AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
           OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
        RAISE EXCEPTION 'Assignment with submissions cannot change lesson/delivery'
          USING ERRCODE='23514';
      END IF;

      IF NEW.max_points < OLD.max_points
         AND EXISTS (
           SELECT 1 FROM assignment_submissions s
           WHERE s.assignment_id = OLD.id
             AND s.points_awarded IS NOT NULL
             AND s.points_awarded > NEW.max_points
         ) THEN
        RAISE EXCEPTION 'Assignment max points cannot undercut historical grades'
          USING ERRCODE='23514';
      END IF;
    END IF;
  END IF;

  SELECT o.id INTO lesson_offering
  FROM course_lessons l
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  JOIN course_offerings o ON o.id = lp.offering_id
  WHERE l.id = NEW.lesson_id
  FOR SHARE OF l, lp, o;

  IF lesson_offering IS NULL THEN
    RAISE EXCEPTION 'Assessment lesson does not resolve to an offering'
      USING ERRCODE='23514';
  END IF;

  IF NEW.delivery_id IS NOT NULL THEN
    SELECT d.offering_id INTO delivery_offering
    FROM course_section_deliveries d
    WHERE d.id = NEW.delivery_id
    FOR SHARE OF d;

    IF delivery_offering IS NULL THEN
      RAISE EXCEPTION 'Assessment delivery is missing'
        USING ERRCODE='23503';
    END IF;
    IF delivery_offering IS DISTINCT FROM lesson_offering THEN
      RAISE EXCEPTION 'Assessment lesson/delivery offering mismatch'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db06_definition$;
--> statement-breakpoint
DROP TRIGGER db06_course_assignment_parent_guard ON course_assignments;
--> statement-breakpoint
CREATE TRIGGER db06_course_assignment_parent_guard
BEFORE INSERT OR UPDATE OF lesson_id, delivery_id, max_points ON course_assignments
FOR EACH ROW EXECUTE FUNCTION db06_guard_assessment_definition();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db06_guard_learner_delivery(
  p_delivery_id uuid, p_membership_id uuid
) RETURNS void LANGUAGE plpgsql AS $db06_learner$
DECLARE
  delivery_section uuid;
  course_college uuid;
  section_college uuid;
  delivery_course uuid;
  delivery_cohort uuid;
  delivery_program uuid;
  delivery_period uuid;
  delivery_type text;
  section_cohort uuid;
  section_period uuid;
  delivery_ended timestamptz;
  offering_status text;
  course_status text;
  section_status text;
  learner_college uuid;

  elective_group uuid;
  elective_group_kind text;
  elective_group_owner text;
  elective_group_college uuid;
  elective_group_status text;
  elective_group_deleted timestamptz;
  elective_slot_program uuid;
  elective_slot_period uuid;
  elective_slot_college uuid;
  elective_slot_status text;
  elective_slot_deleted timestamptz;
  elective_course uuid;
  elective_offering_status text;
  elective_offering_deleted timestamptz;

  roster_row uuid;
  eligibility_row uuid;
BEGIN
  SELECT d.section_id, cdep.college_id, sdep.college_id,
         co.course_id, co.cohort_id, sc.program_id, co.academic_period_id,
         co.type::text, s.cohort_id, s.academic_period_id,
         d.ended_at, co.status::text, c.status::text, s.status::text
    INTO delivery_section, course_college, section_college,
         delivery_course, delivery_cohort, delivery_program, delivery_period,
         delivery_type, section_cohort, section_period,
         delivery_ended, offering_status, course_status, section_status
  FROM course_section_deliveries d
  JOIN course_offerings co ON co.id = d.offering_id
  JOIN courses c ON c.id = co.course_id
  JOIN departments cdep ON cdep.id = c.department_id
  JOIN sections s ON s.id = d.section_id
  JOIN cohorts sc ON sc.id = s.cohort_id
  JOIN programs sp ON sp.id = sc.program_id
  JOIN departments sdep ON sdep.id = sp.department_id
  WHERE d.id = p_delivery_id
  FOR SHARE OF d, co, c, cdep, s, sc, sp, sdep;

  IF delivery_section IS NULL
     OR course_college IS NULL
     OR section_college IS NULL
     OR course_college IS DISTINCT FROM section_college
     OR delivery_ended IS NOT NULL
     OR offering_status <> 'ACTIVE'
     OR course_status <> 'ACTIVE'
     OR section_status <> 'ACTIVE'
     OR delivery_cohort IS DISTINCT FROM section_cohort
     OR delivery_period IS DISTINCT FROM section_period THEN
    RAISE EXCEPTION
      'Assessment delivery is missing, inactive, cross-college, or academically inconsistent'
      USING ERRCODE='23514';
  END IF;

  SELECT m.college_id INTO learner_college
  FROM college_memberships m
  JOIN membership_roles role ON role.membership_id = m.id
    AND role.role = 'LEARNER'
  JOIN users u ON u.id = m.user_id AND u.platform_status = 'ACTIVE'
  WHERE m.id = p_membership_id
    AND m.status = 'ACTIVE'
  FOR SHARE OF m, role, u;

  IF learner_college IS NULL
     OR learner_college IS DISTINCT FROM course_college THEN
    RAISE EXCEPTION 'Assessment learner/delivery tenant mismatch'
      USING ERRCODE='23514';
  END IF;

  -- Any elective binding owns access, including an archived binding. Never
  -- fall back to the host section once a delivery is group-backed.
  SELECT eo.group_id, g.kind, g.owner_scope, g.college_id, g.status, g.deleted_at,
         es.program_id, es.academic_period_id, es.college_id, es.status, es.deleted_at,
         eo.course_id, eo.status, eo.deleted_at
    INTO elective_group, elective_group_kind, elective_group_owner,
         elective_group_college, elective_group_status, elective_group_deleted,
         elective_slot_program, elective_slot_period, elective_slot_college,
         elective_slot_status, elective_slot_deleted,
         elective_course, elective_offering_status, elective_offering_deleted
  FROM elective_offerings eo
  JOIN elective_slots es ON es.id = eo.slot_id
  JOIN lms_groups g ON g.id = eo.group_id
  WHERE eo.backed_delivery_id = p_delivery_id
  FOR SHARE OF eo, es, g;

  IF elective_group IS NOT NULL THEN
    IF delivery_type <> 'ELECTIVE'
       OR delivery_program IS DISTINCT FROM elective_slot_program
       OR elective_group_kind <> 'ELECTIVE'
       OR elective_group_owner <> 'COLLEGE'
       OR elective_group_college IS DISTINCT FROM course_college
       OR elective_group_status <> 'ACTIVE'
       OR elective_group_deleted IS NOT NULL
       OR elective_slot_college IS DISTINCT FROM course_college
       OR elective_slot_status <> 'ACTIVE'
       OR elective_slot_deleted IS NOT NULL
       OR elective_course IS DISTINCT FROM delivery_course
       OR elective_offering_status <> 'ACTIVE'
       OR elective_offering_deleted IS NOT NULL THEN
      RAISE EXCEPTION
        'Elective-backed assessment delivery is not an active valid roster scope'
        USING ERRCODE='23514';
    END IF;

    SELECT gm.id INTO roster_row
    FROM lms_group_members gm
    WHERE gm.group_id = elective_group
      AND gm.membership_id = p_membership_id
      AND gm.member_type = 'LEARNER'
      AND gm.state = 'ACTIVE'
    FOR SHARE;

    IF roster_row IS NULL THEN
      RAISE EXCEPTION 'Learner is not in the active elective assessment roster'
        USING ERRCODE='23514';
    END IF;

    SELECT lpe.id INTO eligibility_row
    FROM learner_program_enrollments lpe
    JOIN section_enrollments se ON se.learner_enrollment_id = lpe.id
    JOIN sections home ON home.id = se.section_id
    JOIN programs p ON p.id = lpe.program_id
    JOIN departments pd ON pd.id = p.department_id
    WHERE lpe.membership_id = p_membership_id
      AND lpe.status = 'ACTIVE'
      AND se.status = 'ACTIVE'
      AND home.status = 'ACTIVE'
      AND home.cohort_id = lpe.cohort_id
      AND home.academic_period_id = se.academic_period_id
      AND lpe.program_id = elective_slot_program
      AND pd.college_id = course_college
      AND (elective_slot_period IS NULL
           OR se.academic_period_id = elective_slot_period)
    LIMIT 1
    FOR SHARE OF lpe, se, home, p, pd;

    IF eligibility_row IS NULL THEN
      RAISE EXCEPTION 'Learner no longer satisfies elective academic eligibility'
        USING ERRCODE='23514';
    END IF;

    RETURN;
  END IF;

  SELECT se.id INTO eligibility_row
  FROM section_enrollments se
  JOIN learner_program_enrollments lpe ON lpe.id = se.learner_enrollment_id
  WHERE se.section_id = delivery_section
    AND se.academic_period_id = section_period
    AND se.status = 'ACTIVE'
    AND lpe.membership_id = p_membership_id
    AND lpe.cohort_id = section_cohort
    AND lpe.status = 'ACTIVE'
  LIMIT 1
  FOR SHARE OF se, lpe;

  IF eligibility_row IS NULL THEN
    RAISE EXCEPTION 'Learner is not actively enrolled in assessment section'
      USING ERRCODE='23514';
  END IF;
END;
$db06_learner$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db06_guard_quiz_attempt_parent()
RETURNS trigger LANGUAGE plpgsql AS $db06_attempt$
DECLARE
  source_offering uuid;
  attempt_offering uuid;
  fixed_delivery uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
       OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
       OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     ) THEN
    RAISE EXCEPTION 'Quiz attempt attribution is immutable'
      USING ERRCODE='23514';
  END IF;

  SELECT o.id, q.delivery_id
    INTO source_offering, fixed_delivery
  FROM course_quizzes q
  JOIN course_lessons l ON l.id = q.lesson_id
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  JOIN course_offerings o ON o.id = lp.offering_id
  WHERE q.id = NEW.quiz_id
  FOR SHARE OF q, l, lp, o;

  SELECT d.offering_id INTO attempt_offering
  FROM course_section_deliveries d
  WHERE d.id = NEW.delivery_id
  FOR SHARE OF d;

  IF source_offering IS NULL
     OR attempt_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL
         AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Quiz attempt is attached to the wrong delivery'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM db06_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;

  RETURN NEW;
END;
$db06_attempt$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db06_guard_assignment_grader(
  p_delivery_id uuid, p_user_id uuid
) RETURNS void LANGUAGE plpgsql AS $db06_grader$
DECLARE
  course_college uuid;
  section_college uuid;
  actor_membership uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Graded assignment requires a grader'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1
  FROM users u
  WHERE u.id = p_user_id
    AND u.platform_status = 'ACTIVE'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment grader must be an active user'
      USING ERRCODE='23514';
  END IF;

  SELECT cdep.college_id, sdep.college_id
    INTO course_college, section_college
  FROM course_section_deliveries d
  JOIN course_offerings co ON co.id = d.offering_id
  JOIN courses c ON c.id = co.course_id
  JOIN departments cdep ON cdep.id = c.department_id
  JOIN sections s ON s.id = d.section_id
  JOIN cohorts sc ON sc.id = s.cohort_id
  JOIN programs sp ON sp.id = sc.program_id
  JOIN departments sdep ON sdep.id = sp.department_id
  WHERE d.id = p_delivery_id
  FOR SHARE OF d, co, c, cdep, s, sc, sp, sdep;

  IF course_college IS NULL
     OR section_college IS NULL
     OR course_college IS DISTINCT FROM section_college THEN
    RAISE EXCEPTION 'Assignment grader delivery scope is missing or cross-college'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1
  FROM system_roles sr
  WHERE sr.user_id = p_user_id
    AND sr.role = 'SUPER_ADMIN'
  FOR SHARE;
  IF FOUND THEN
    RETURN;
  END IF;

  SELECT cm.id INTO actor_membership
  FROM college_memberships cm
  WHERE cm.user_id = p_user_id
    AND cm.college_id = course_college
    AND cm.status = 'ACTIVE'
  FOR SHARE;

  IF actor_membership IS NULL THEN
    RAISE EXCEPTION 'Assignment grader has no active membership in delivery college'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1
  FROM membership_roles mr
  WHERE mr.membership_id = actor_membership
    AND mr.role = 'COLLEGE_ADMIN'
  FOR SHARE;
  IF FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
  FROM membership_roles mr
  WHERE mr.membership_id = actor_membership
    AND mr.role = 'FACULTY'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment grader requires COLLEGE_ADMIN or FACULTY role'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1
  FROM course_teaching_assignments ta
  WHERE ta.delivery_id = p_delivery_id
    AND ta.membership_id = actor_membership
    AND ta.ended_at IS NULL
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Faculty grader is not actively assigned to this delivery'
      USING ERRCODE='23514';
  END IF;
END;
$db06_grader$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db06_guard_assignment_submission_parent()
RETURNS trigger LANGUAGE plpgsql AS $db06_submission$
DECLARE
  source_offering uuid;
  submission_offering uuid;
  fixed_delivery uuid;
  max_points integer;
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
       OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
       OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     ) THEN
    RAISE EXCEPTION 'Assignment submission attribution is immutable'
      USING ERRCODE='23514';
  END IF;

  SELECT o.id, a.delivery_id, a.max_points
    INTO source_offering, fixed_delivery, max_points
  FROM course_assignments a
  JOIN course_lessons l ON l.id = a.lesson_id
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  JOIN course_offerings o ON o.id = lp.offering_id
  WHERE a.id = NEW.assignment_id
  FOR SHARE OF a, l, lp, o;

  SELECT d.offering_id INTO submission_offering
  FROM course_section_deliveries d
  WHERE d.id = NEW.delivery_id
  FOR SHARE OF d;

  IF source_offering IS NULL
     OR submission_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL
         AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Assignment submission has wrong delivery'
      USING ERRCODE='23514';
  END IF;

  IF NEW.points_awarded IS NOT NULL
     AND (max_points IS NULL OR NEW.points_awarded > max_points) THEN
    RAISE EXCEPTION 'Assignment grade exceeds assignment maximum points'
      USING ERRCODE='23514';
  END IF;

  -- Historical corrections remain valid after learner graduation: active
  -- learner scope is only required when the submission is first created.
  IF TG_OP = 'INSERT' THEN
    PERFORM db06_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;

  -- A grade write must persist a currently authorized grader. Publication
  -- alone is intentionally not watched because the row lacks publisher actor.
  IF NEW.grading_status = 'GRADED' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM db06_guard_assignment_grader(
        NEW.delivery_id, NEW.graded_by_user_id
      );
    ELSIF NEW.points_awarded IS DISTINCT FROM OLD.points_awarded
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.grading_status IS DISTINCT FROM OLD.grading_status
       OR NEW.graded_by_user_id IS DISTINCT FROM OLD.graded_by_user_id
       OR NEW.graded_at IS DISTINCT FROM OLD.graded_at THEN
      PERFORM db06_guard_assignment_grader(
        NEW.delivery_id, NEW.graded_by_user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$db06_submission$;
--> statement-breakpoint
DROP TRIGGER db06_assignment_submission_parent_guard ON assignment_submissions;
--> statement-breakpoint
CREATE TRIGGER db06_assignment_submission_parent_guard
BEFORE INSERT OR UPDATE OF
  assignment_id, delivery_id, membership_id, points_awarded, feedback,
  grading_status, graded_by_user_id, graded_at
ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION db06_guard_assignment_submission_parent();
