-- DB-028: Assessment cross-parent relational guard CANDIDATE (NOT REGISTERED).
-- Do not apply by itself. W01 must coordinate with the DB02/DB05 migrations,
-- verify the author/learner roles and tenant locking, then generate the single
-- numbered Drizzle migration + snapshot and replay on disposable PostgreSQL.
-- Source audit baselines: registered 0040 assessments.ts/quizzes.ts/courses.ts.
-- Protects NEW writes and retargeting only; historical grades remain mutable.

CREATE FUNCTION db28_guard_assessment_definition()
RETURNS trigger LANGUAGE plpgsql AS $db28_def$
DECLARE
  lesson_offering uuid;
  delivery_offering uuid;
BEGIN
  -- Reject silent parent re-targeting once any learner records reference it.
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'course_quizzes'
       AND EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = OLD.id)
       AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
         OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
      RAISE EXCEPTION 'Quiz with attempts cannot change lesson/delivery'
        USING ERRCODE = '23514';
    END IF;
    IF TG_TABLE_NAME = 'course_assignments'
       AND EXISTS (SELECT 1 FROM assignment_submissions a WHERE a.assignment_id = OLD.id)
       AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
         OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
      RAISE EXCEPTION 'Assignment with submissions cannot change lesson/delivery'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  SELECT lp.offering_id INTO lesson_offering
    FROM course_lessons l
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    WHERE l.id = NEW.lesson_id;
  IF lesson_offering IS NULL THEN
    RAISE EXCEPTION 'Assessment lesson does not resolve to an offering'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.delivery_id IS NOT NULL THEN
    SELECT d.offering_id INTO delivery_offering
      FROM course_section_deliveries d WHERE d.id = NEW.delivery_id;
    IF delivery_offering IS DISTINCT FROM lesson_offering THEN
      RAISE EXCEPTION 'Assessment lesson/delivery offering mismatch'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$db28_def$;

CREATE TRIGGER db28_course_quiz_parent_guard
  BEFORE INSERT OR UPDATE OF lesson_id, delivery_id ON course_quizzes
  FOR EACH ROW EXECUTE FUNCTION db28_guard_assessment_definition();

CREATE TRIGGER db28_course_assignment_parent_guard
  BEFORE INSERT OR UPDATE OF lesson_id, delivery_id ON course_assignments
  FOR EACH ROW EXECUTE FUNCTION db28_guard_assessment_definition();

CREATE FUNCTION db28_guard_learner_delivery(
  p_delivery_id uuid, p_membership_id uuid
) RETURNS void LANGUAGE plpgsql AS $db28_learner$
DECLARE
  delivery_section uuid;
  section_college uuid;
  learner_college uuid;
BEGIN
  SELECT d.section_id, dep.college_id
    INTO delivery_section, section_college
    FROM course_section_deliveries d
    JOIN sections s ON s.id = d.section_id
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments dep ON dep.id = p.department_id
    WHERE d.id = p_delivery_id;
  SELECT m.college_id INTO learner_college
    FROM college_memberships m
    JOIN membership_roles role ON role.membership_id = m.id
      AND role.role = 'LEARNER'
    JOIN users u ON u.id = m.user_id AND u.platform_status = 'ACTIVE'
    WHERE m.id = p_membership_id AND m.status = 'ACTIVE'
    FOR SHARE OF m, role, u;

  IF delivery_section IS NULL OR section_college IS NULL
     OR learner_college IS DISTINCT FROM section_college THEN
    RAISE EXCEPTION 'Assessment learner/delivery tenant mismatch'
      USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM section_enrollments se
    JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id
    WHERE se.section_id = delivery_section
      AND se.status = 'ACTIVE'
      AND le.membership_id = p_membership_id AND le.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Learner is not actively enrolled in assessment section'
      USING ERRCODE = '23514';
  END IF;
END;
$db28_learner$;

CREATE FUNCTION db28_guard_quiz_attempt_parent()
RETURNS trigger LANGUAGE plpgsql AS $db28_attempt$
DECLARE
  source_offering uuid;
  attempt_offering uuid;
  fixed_delivery uuid;
BEGIN
  SELECT lp.offering_id, q.delivery_id
    INTO source_offering, fixed_delivery
    FROM course_quizzes q
    JOIN course_lessons l ON l.id = q.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    WHERE q.id = NEW.quiz_id;
  SELECT d.offering_id INTO attempt_offering
    FROM course_section_deliveries d WHERE d.id = NEW.delivery_id;

  IF source_offering IS NULL OR attempt_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Quiz attempt is attached to the wrong delivery'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM db28_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  ELSIF NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
     OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id THEN
    PERFORM db28_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;
  RETURN NEW;
END;
$db28_attempt$;

CREATE TRIGGER db28_quiz_attempt_parent_guard
  BEFORE INSERT OR UPDATE OF quiz_id, delivery_id, membership_id
    ON quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION db28_guard_quiz_attempt_parent();

CREATE FUNCTION db28_guard_assignment_submission_parent()
RETURNS trigger LANGUAGE plpgsql AS $db28_submission$
DECLARE
  source_offering uuid;
  submission_offering uuid;
  fixed_delivery uuid;
  max_points integer;
BEGIN
  SELECT lp.offering_id, a.delivery_id, a.max_points
    INTO source_offering, fixed_delivery, max_points
    FROM course_assignments a
    JOIN course_lessons l ON l.id = a.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    WHERE a.id = NEW.assignment_id;
  SELECT d.offering_id INTO submission_offering
    FROM course_section_deliveries d WHERE d.id = NEW.delivery_id;

  IF source_offering IS NULL OR submission_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Assignment submission has wrong delivery'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.points_awarded IS NOT NULL
     AND (max_points IS NULL OR NEW.points_awarded > max_points) THEN
    RAISE EXCEPTION 'Assignment grade exceeds assignment maximum points'
      USING ERRCODE = '23514';
  END IF;

  -- A correction may occur after the learner graduates. Check active roster
  -- only for new submissions or changes to immutable attribution fields.
  IF TG_OP = 'INSERT' THEN
    PERFORM db28_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  ELSIF NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
     OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id THEN
    PERFORM db28_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;
  RETURN NEW;
END;
$db28_submission$;

CREATE TRIGGER db28_assignment_submission_parent_guard
  BEFORE INSERT OR UPDATE OF assignment_id, delivery_id, membership_id, points_awarded
    ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION db28_guard_assignment_submission_parent();

CREATE FUNCTION db28_guard_quiz_answer_parent()
RETURNS trigger LANGUAGE plpgsql AS $db28_answer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM quiz_attempts a
    JOIN quiz_questions q ON q.id = NEW.question_id
    WHERE a.id = NEW.attempt_id AND q.quiz_id = a.quiz_id
  ) THEN
    RAISE EXCEPTION 'Quiz answer question belongs to a different quiz'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db28_answer$;

CREATE TRIGGER db28_quiz_answer_parent_guard
  BEFORE INSERT OR UPDATE OF attempt_id, question_id
    ON quiz_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION db28_guard_quiz_answer_parent();

-- W01 integration blockers: verify the exact section/offering parent graph and
-- locking order with DB02/DB05, add immutable question/lesson/path parent guards
-- (or equivalent scoped FK), protect parent reparenting and direct SQL rights,
-- and execute wrong-tenant/wrong-quiz/wrong-delivery/grading and concurrent
-- suspension/enrollment/retargeting rollback tests on disposable PostgreSQL.
