-- DB-030 / DB06 assessment relational integrity.
-- Trigger-only migration. Drizzle schema tables are unchanged.
-- Source draft: docs/planning/sql/db06-assessment-parent-scope-candidate.sql
--
-- Locking rule: history-producing children take SHARE locks on mutable parent
-- rows. Parent UPDATEs take row update locks, so parent retargeting and child
-- creation serialize instead of both validating stale pre-commit state.

-- Fail before installing guards if current relational history is already
-- inconsistent. This is deliberately non-destructive: no rows are repaired.
DO $db06_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM course_quizzes q
    JOIN course_lessons l ON l.id = q.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    JOIN course_section_deliveries d ON d.id = q.delivery_id
    WHERE q.delivery_id IS NOT NULL
      AND d.offering_id IS DISTINCT FROM lp.offering_id
  ) THEN
    RAISE EXCEPTION 'DB06 preflight: quiz lesson/delivery offering mismatch'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM course_assignments a
    JOIN course_lessons l ON l.id = a.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    JOIN course_section_deliveries d ON d.id = a.delivery_id
    WHERE a.delivery_id IS NOT NULL
      AND d.offering_id IS DISTINCT FROM lp.offering_id
  ) THEN
    RAISE EXCEPTION 'DB06 preflight: assignment lesson/delivery offering mismatch'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM quiz_attempts a
    JOIN course_quizzes q ON q.id = a.quiz_id
    JOIN course_lessons l ON l.id = q.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    JOIN course_section_deliveries d ON d.id = a.delivery_id
    WHERE d.offering_id IS DISTINCT FROM lp.offering_id
       OR (q.delivery_id IS NOT NULL AND q.delivery_id IS DISTINCT FROM a.delivery_id)
  ) THEN
    RAISE EXCEPTION 'DB06 preflight: quiz attempt parent mismatch'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM assignment_submissions s
    JOIN course_assignments a ON a.id = s.assignment_id
    JOIN course_lessons l ON l.id = a.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    JOIN course_section_deliveries d ON d.id = s.delivery_id
    WHERE d.offering_id IS DISTINCT FROM lp.offering_id
       OR (a.delivery_id IS NOT NULL AND a.delivery_id IS DISTINCT FROM s.delivery_id)
       OR (s.points_awarded IS NOT NULL AND s.points_awarded > a.max_points)
  ) THEN
    RAISE EXCEPTION 'DB06 preflight: assignment submission parent/grade mismatch'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM quiz_attempt_answers aa
    JOIN quiz_attempts a ON a.id = aa.attempt_id
    JOIN quiz_questions q ON q.id = aa.question_id
    WHERE q.quiz_id IS DISTINCT FROM a.quiz_id
  ) THEN
    RAISE EXCEPTION 'DB06 preflight: quiz answer question mismatch'
      USING ERRCODE='23514';
  END IF;
END;
$db06_preflight$;
--> statement-breakpoint

CREATE FUNCTION db06_guard_assessment_definition()
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
    IF TG_TABLE_NAME = 'course_assignments'
       AND EXISTS (SELECT 1 FROM assignment_submissions s WHERE s.assignment_id = OLD.id)
       AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
         OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
      RAISE EXCEPTION 'Assignment with submissions cannot change lesson/delivery'
        USING ERRCODE='23514';
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
CREATE TRIGGER db06_course_quiz_parent_guard
BEFORE INSERT OR UPDATE OF lesson_id, delivery_id ON course_quizzes
FOR EACH ROW EXECUTE FUNCTION db06_guard_assessment_definition();
--> statement-breakpoint
CREATE TRIGGER db06_course_assignment_parent_guard
BEFORE INSERT OR UPDATE OF lesson_id, delivery_id ON course_assignments
FOR EACH ROW EXECUTE FUNCTION db06_guard_assessment_definition();
--> statement-breakpoint

CREATE FUNCTION db06_guard_learner_delivery(
  p_delivery_id uuid, p_membership_id uuid
) RETURNS void LANGUAGE plpgsql AS $db06_learner$
DECLARE
  delivery_section uuid;
  offering_cohort uuid;
  offering_period uuid;
  offering_college uuid;
  section_cohort uuid;
  section_period uuid;
  section_college uuid;
  learner_college uuid;
BEGIN
  SELECT d.section_id,
         co.cohort_id, co.academic_period_id, course_dep.college_id,
         s.cohort_id, s.academic_period_id, section_dep.college_id
    INTO delivery_section,
         offering_cohort, offering_period, offering_college,
         section_cohort, section_period, section_college
    FROM course_section_deliveries d
    JOIN course_offerings co ON co.id = d.offering_id
    JOIN courses course ON course.id = co.course_id
    JOIN departments course_dep ON course_dep.id = course.department_id
    JOIN sections s ON s.id = d.section_id
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments section_dep ON section_dep.id = p.department_id
    WHERE d.id = p_delivery_id
    FOR SHARE OF d, co, course, course_dep, s, c, p, section_dep;

  IF delivery_section IS NULL
     OR offering_cohort IS DISTINCT FROM section_cohort
     OR offering_period IS DISTINCT FROM section_period
     OR offering_college IS DISTINCT FROM section_college THEN
    RAISE EXCEPTION 'Assessment delivery offering/section scope mismatch'
      USING ERRCODE='23514';
  END IF;

  SELECT m.college_id INTO learner_college
    FROM college_memberships m
    JOIN membership_roles role ON role.membership_id = m.id
      AND role.role = 'LEARNER'
    JOIN users u ON u.id = m.user_id AND u.platform_status = 'ACTIVE'
    WHERE m.id = p_membership_id AND m.status = 'ACTIVE'
    FOR SHARE OF m, role, u;

  IF learner_college IS DISTINCT FROM section_college THEN
    RAISE EXCEPTION 'Assessment learner/delivery tenant mismatch'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1
    FROM section_enrollments se
    JOIN learner_program_enrollments le ON le.id = se.learner_enrollment_id
    WHERE se.section_id = delivery_section
      AND se.status = 'ACTIVE'
      AND le.membership_id = p_membership_id
      AND le.status = 'ACTIVE'
    FOR SHARE OF se, le;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Learner is not actively enrolled in assessment section'
      USING ERRCODE='23514';
  END IF;
END;
$db06_learner$;
--> statement-breakpoint

CREATE FUNCTION db06_guard_quiz_attempt_parent()
RETURNS trigger LANGUAGE plpgsql AS $db06_attempt$
DECLARE
  source_offering uuid;
  attempt_offering uuid;
  fixed_delivery uuid;
BEGIN
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

  IF source_offering IS NULL OR attempt_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Quiz attempt is attached to the wrong delivery'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
     OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id THEN
    PERFORM db06_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;
  RETURN NEW;
END;
$db06_attempt$;
--> statement-breakpoint
CREATE TRIGGER db06_quiz_attempt_parent_guard
BEFORE INSERT OR UPDATE OF quiz_id, delivery_id, membership_id ON quiz_attempts
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_attempt_parent();
--> statement-breakpoint

CREATE FUNCTION db06_guard_assignment_submission_parent()
RETURNS trigger LANGUAGE plpgsql AS $db06_submission$
DECLARE
  source_offering uuid;
  submission_offering uuid;
  fixed_delivery uuid;
  max_points integer;
BEGIN
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

  IF source_offering IS NULL OR submission_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Assignment submission has wrong delivery'
      USING ERRCODE='23514';
  END IF;

  IF NEW.points_awarded IS NOT NULL
     AND (max_points IS NULL OR NEW.points_awarded > max_points) THEN
    RAISE EXCEPTION 'Assignment grade exceeds assignment maximum points'
      USING ERRCODE='23514';
  END IF;

  -- Historical grading corrections are allowed after enrollment ends. Recheck
  -- active learner scope only for new rows or attribution-parent changes.
  IF TG_OP = 'INSERT'
     OR NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
     OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id THEN
    PERFORM db06_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;
  RETURN NEW;
END;
$db06_submission$;
--> statement-breakpoint
CREATE TRIGGER db06_assignment_submission_parent_guard
BEFORE INSERT OR UPDATE OF assignment_id, delivery_id, membership_id, points_awarded
ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION db06_guard_assignment_submission_parent();
--> statement-breakpoint

CREATE FUNCTION db06_guard_quiz_answer_parent()
RETURNS trigger LANGUAGE plpgsql AS $db06_answer$
BEGIN
  PERFORM 1
    FROM quiz_attempts a
    JOIN quiz_questions q ON q.id = NEW.question_id
    WHERE a.id = NEW.attempt_id
      AND q.quiz_id = a.quiz_id
    FOR SHARE OF a, q;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz answer question belongs to a different quiz'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_answer$;
--> statement-breakpoint
CREATE TRIGGER db06_quiz_answer_parent_guard
BEFORE INSERT OR UPDATE OF attempt_id, question_id ON quiz_attempt_answers
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_answer_parent();
--> statement-breakpoint

-- Parent history guards -----------------------------------------------------

CREATE FUNCTION db06_guard_lesson_assessment_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db06_lesson$
DECLARE
  new_offering uuid;
BEGIN
  IF NEW.learning_path_id IS NOT DISTINCT FROM OLD.learning_path_id THEN
    RETURN NEW;
  END IF;
  SELECT offering_id INTO new_offering
    FROM course_learning_paths
    WHERE id = NEW.learning_path_id
    FOR SHARE;
  IF new_offering IS NULL THEN
    RAISE EXCEPTION 'Assessment lesson target learning path is missing'
      USING ERRCODE='23503';
  END IF;

  IF EXISTS (
      SELECT 1 FROM course_quizzes q
      JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.lesson_id = OLD.id
    ) OR EXISTS (
      SELECT 1 FROM course_assignments a
      JOIN assignment_submissions s ON s.assignment_id = a.id
      WHERE a.lesson_id = OLD.id
    ) THEN
    RAISE EXCEPTION 'Lesson with assessment history requires controlled transfer'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM course_quizzes q
    JOIN course_section_deliveries d ON d.id = q.delivery_id
    WHERE q.lesson_id = OLD.id AND q.delivery_id IS NOT NULL
      AND d.offering_id IS DISTINCT FROM new_offering
  ) OR EXISTS (
    SELECT 1 FROM course_assignments a
    JOIN course_section_deliveries d ON d.id = a.delivery_id
    WHERE a.lesson_id = OLD.id AND a.delivery_id IS NOT NULL
      AND d.offering_id IS DISTINCT FROM new_offering
  ) THEN
    RAISE EXCEPTION 'Lesson move would detach fixed-delivery assessments'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_lesson$;
--> statement-breakpoint
CREATE TRIGGER db06_lesson_assessment_reparent_guard
BEFORE UPDATE OF learning_path_id ON course_lessons
FOR EACH ROW EXECUTE FUNCTION db06_guard_lesson_assessment_reparent();
--> statement-breakpoint

CREATE FUNCTION db06_guard_learning_path_assessment_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db06_path$
BEGIN
  IF NEW.offering_id IS NOT DISTINCT FROM OLD.offering_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
      SELECT 1 FROM course_lessons l
      JOIN course_quizzes q ON q.lesson_id = l.id
      JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE l.learning_path_id = OLD.id
    ) OR EXISTS (
      SELECT 1 FROM course_lessons l
      JOIN course_assignments a ON a.lesson_id = l.id
      JOIN assignment_submissions s ON s.assignment_id = a.id
      WHERE l.learning_path_id = OLD.id
    ) THEN
    RAISE EXCEPTION 'Learning path with assessment history cannot change offering'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM course_lessons l
    JOIN course_quizzes q ON q.lesson_id = l.id
    JOIN course_section_deliveries d ON d.id = q.delivery_id
    WHERE l.learning_path_id = OLD.id AND q.delivery_id IS NOT NULL
      AND d.offering_id IS DISTINCT FROM NEW.offering_id
  ) OR EXISTS (
    SELECT 1 FROM course_lessons l
    JOIN course_assignments a ON a.lesson_id = l.id
    JOIN course_section_deliveries d ON d.id = a.delivery_id
    WHERE l.learning_path_id = OLD.id AND a.delivery_id IS NOT NULL
      AND d.offering_id IS DISTINCT FROM NEW.offering_id
  ) THEN
    RAISE EXCEPTION 'Learning path move would detach fixed-delivery assessments'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_path$;
--> statement-breakpoint
CREATE TRIGGER db06_learning_path_assessment_reparent_guard
BEFORE UPDATE OF offering_id ON course_learning_paths
FOR EACH ROW EXECUTE FUNCTION db06_guard_learning_path_assessment_reparent();
--> statement-breakpoint

CREATE FUNCTION db06_guard_quiz_question_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db06_question$
BEGIN
  IF NEW.quiz_id IS NOT DISTINCT FROM OLD.quiz_id THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_id IN (OLD.quiz_id, NEW.quiz_id))
     OR EXISTS (SELECT 1 FROM quiz_attempt_answers WHERE question_id = OLD.id) THEN
    RAISE EXCEPTION 'Question cannot move between quizzes after attempt history exists'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_question$;
--> statement-breakpoint
CREATE TRIGGER db06_quiz_question_reparent_guard
BEFORE UPDATE OF quiz_id ON quiz_questions
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_question_reparent();
--> statement-breakpoint

CREATE FUNCTION db06_guard_delivery_assessment_history()
RETURNS trigger LANGUAGE plpgsql AS $db06_delivery$
BEGIN
  IF (NEW.offering_id, NEW.section_id) IS NOT DISTINCT FROM
     (OLD.offering_id, OLD.section_id) THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM quiz_attempts WHERE delivery_id = OLD.id)
     OR EXISTS (SELECT 1 FROM assignment_submissions WHERE delivery_id = OLD.id)
     OR EXISTS (SELECT 1 FROM course_quizzes WHERE delivery_id = OLD.id)
     OR EXISTS (SELECT 1 FROM course_assignments WHERE delivery_id = OLD.id) THEN
    RAISE EXCEPTION 'Delivery with assessment history requires controlled transfer'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_delivery$;
--> statement-breakpoint
CREATE TRIGGER db06_delivery_assessment_history_guard
BEFORE UPDATE OF offering_id, section_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db06_guard_delivery_assessment_history();
--> statement-breakpoint

CREATE FUNCTION db06_guard_section_assessment_history()
RETURNS trigger LANGUAGE plpgsql AS $db06_section$
BEGIN
  IF (NEW.cohort_id, NEW.academic_period_id) IS NOT DISTINCT FROM
     (OLD.cohort_id, OLD.academic_period_id) THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
      SELECT 1 FROM course_section_deliveries d
      WHERE d.section_id = OLD.id
        AND (
          EXISTS (SELECT 1 FROM quiz_attempts q WHERE q.delivery_id = d.id)
          OR EXISTS (SELECT 1 FROM assignment_submissions a WHERE a.delivery_id = d.id)
          OR EXISTS (SELECT 1 FROM course_quizzes q WHERE q.delivery_id = d.id)
          OR EXISTS (SELECT 1 FROM course_assignments a WHERE a.delivery_id = d.id)
        )
    ) THEN
    RAISE EXCEPTION 'Section with assessment history requires controlled transfer'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_section$;
--> statement-breakpoint
CREATE TRIGGER db06_section_assessment_history_guard
BEFORE UPDATE OF cohort_id, academic_period_id ON sections
FOR EACH ROW EXECUTE FUNCTION db06_guard_section_assessment_history();
--> statement-breakpoint

CREATE FUNCTION db06_guard_offering_assessment_history()
RETURNS trigger LANGUAGE plpgsql AS $db06_offering$
BEGIN
  IF (NEW.course_id, NEW.cohort_id, NEW.academic_period_id) IS NOT DISTINCT FROM
     (OLD.course_id, OLD.cohort_id, OLD.academic_period_id) THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
      SELECT 1
      FROM course_learning_paths lp
      JOIN course_lessons l ON l.learning_path_id = lp.id
      JOIN course_quizzes q ON q.lesson_id = l.id
      JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE lp.offering_id = OLD.id
    ) OR EXISTS (
      SELECT 1
      FROM course_learning_paths lp
      JOIN course_lessons l ON l.learning_path_id = lp.id
      JOIN course_assignments a ON a.lesson_id = l.id
      JOIN assignment_submissions s ON s.assignment_id = a.id
      WHERE lp.offering_id = OLD.id
    ) THEN
    RAISE EXCEPTION 'Offering with assessment history requires controlled transfer'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_offering$;
--> statement-breakpoint
CREATE TRIGGER db06_offering_assessment_history_guard
BEFORE UPDATE OF course_id, cohort_id, academic_period_id ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db06_guard_offering_assessment_history();
