-- DB-030 canonical assessment cross-parent relational guard CANDIDATE.
-- NOT REGISTERED. Do not apply by itself.
--
-- Chat 1 integration review on 2026-10-11 reconciled the original DB-028-named
-- source draft against current DB02/DB03/DB05 contracts:
-- * DB02 serializes historic parent insertion with explicit FOR SHARE locks.
-- * DB03 makes ACTIVE elective-group membership the sole learner roster for an
--   elective-backed delivery; host-section membership must not grant access.
-- * DB05's course-parent graph uses a separate advisory lock and does not own
--   learning-path/lesson/assessment parentage.
--
-- This file is therefore the one DB06 promotion input. Historical db28_ names
-- are retained to avoid inventing a duplicate family of functions/triggers.
-- W01 must still generate one numbered Drizzle migration/snapshot and execute
-- the PostgreSQL witnesses in the DB06 handoff before registration/verification.

-- ---------------------------------------------------------------------------
-- Migration preflight: fail on relational poison; never clean data silently.
-- Historical learner/grader lifecycle is intentionally NOT required to be
-- currently active here. Existing historical rows may outlive active roster or
-- faculty assignment, but their structural parentage must still be coherent.
-- ---------------------------------------------------------------------------
DO $db30_preflight$
DECLARE
  bad_count bigint;
BEGIN
  SELECT count(*) INTO bad_count
  FROM course_quizzes q
  JOIN course_lessons l ON l.id = q.lesson_id
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  LEFT JOIN course_section_deliveries d ON d.id = q.delivery_id
  WHERE q.delivery_id IS NOT NULL
    AND d.offering_id IS DISTINCT FROM lp.offering_id;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'DB30 preflight: % quiz definitions have lesson/delivery offering mismatch', bad_count
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO bad_count
  FROM course_assignments a
  JOIN course_lessons l ON l.id = a.lesson_id
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  LEFT JOIN course_section_deliveries d ON d.id = a.delivery_id
  WHERE a.delivery_id IS NOT NULL
    AND d.offering_id IS DISTINCT FROM lp.offering_id;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'DB30 preflight: % assignment definitions have lesson/delivery offering mismatch', bad_count
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO bad_count
  FROM quiz_attempts qa
  JOIN course_quizzes q ON q.id = qa.quiz_id
  JOIN course_lessons l ON l.id = q.lesson_id
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  JOIN course_section_deliveries d ON d.id = qa.delivery_id
  WHERE d.offering_id IS DISTINCT FROM lp.offering_id
     OR (q.delivery_id IS NOT NULL AND q.delivery_id IS DISTINCT FROM qa.delivery_id);
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'DB30 preflight: % quiz attempts have invalid delivery parentage', bad_count
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO bad_count
  FROM assignment_submissions s
  JOIN course_assignments a ON a.id = s.assignment_id
  JOIN course_lessons l ON l.id = a.lesson_id
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  JOIN course_section_deliveries d ON d.id = s.delivery_id
  WHERE d.offering_id IS DISTINCT FROM lp.offering_id
     OR (a.delivery_id IS NOT NULL AND a.delivery_id IS DISTINCT FROM s.delivery_id)
     OR (s.points_awarded IS NOT NULL AND s.points_awarded > a.max_points);
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'DB30 preflight: % assignment submissions have invalid parentage/grade bounds', bad_count
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO bad_count
  FROM quiz_attempt_answers aa
  JOIN quiz_attempts qa ON qa.id = aa.attempt_id
  JOIN quiz_questions qq ON qq.id = aa.question_id
  WHERE qq.quiz_id IS DISTINCT FROM qa.quiz_id;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'DB30 preflight: % quiz answers point at a question from another quiz', bad_count
      USING ERRCODE = '23514';
  END IF;

  -- Historical learner rows need not be ACTIVE, but the recorded membership
  -- must still belong to the college that owns the recorded delivery.
  SELECT count(*) INTO bad_count
  FROM (
    SELECT qa.membership_id, qa.delivery_id FROM quiz_attempts qa
    UNION ALL
    SELECT s.membership_id, s.delivery_id FROM assignment_submissions s
  ) history
  JOIN college_memberships cm ON cm.id = history.membership_id
  JOIN course_section_deliveries d ON d.id = history.delivery_id
  JOIN course_offerings co ON co.id = d.offering_id
  JOIN courses c ON c.id = co.course_id
  JOIN departments dep ON dep.id = c.department_id
  WHERE cm.college_id IS DISTINCT FROM dep.college_id;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'DB30 preflight: % historical assessment learner rows cross college scope', bad_count
      USING ERRCODE = '23514';
  END IF;
END;
$db30_preflight$;

-- ---------------------------------------------------------------------------
-- Assessment definitions: lock lesson -> learning path -> optional delivery.
-- Explicit SHARE locks conflict with parent reparent UPDATEs (NO KEY UPDATE),
-- unlike FK KEY SHARE alone, so a concurrent parent move and child write cannot
-- both commit based on stale parentage.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db28_guard_assessment_definition()
RETURNS trigger LANGUAGE plpgsql AS $db28_def$
DECLARE
  lesson_path uuid;
  lesson_offering uuid;
  delivery_offering uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'course_quizzes'
       AND EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = OLD.id)
       AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
         OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
      RAISE EXCEPTION 'Quiz with attempts cannot change lesson/delivery'
        USING ERRCODE = '23514';
    END IF;

    IF TG_TABLE_NAME = 'course_assignments' THEN
      IF EXISTS (SELECT 1 FROM assignment_submissions s WHERE s.assignment_id = OLD.id)
         AND (NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
           OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id) THEN
        RAISE EXCEPTION 'Assignment with submissions cannot change lesson/delivery'
          USING ERRCODE = '23514';
      END IF;

      IF NEW.max_points < OLD.max_points
         AND EXISTS (
           SELECT 1 FROM assignment_submissions s
           WHERE s.assignment_id = OLD.id
             AND s.points_awarded IS NOT NULL
             AND s.points_awarded > NEW.max_points
         ) THEN
        RAISE EXCEPTION 'Assignment max points cannot undercut historical grades'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  SELECT l.learning_path_id INTO lesson_path
  FROM course_lessons l
  WHERE l.id = NEW.lesson_id
  FOR SHARE;
  IF lesson_path IS NULL THEN
    RAISE EXCEPTION 'Assessment lesson does not exist'
      USING ERRCODE = '23503';
  END IF;

  SELECT lp.offering_id INTO lesson_offering
  FROM course_learning_paths lp
  WHERE lp.id = lesson_path
  FOR SHARE;
  IF lesson_offering IS NULL THEN
    RAISE EXCEPTION 'Assessment lesson does not resolve to an offering'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.delivery_id IS NOT NULL THEN
    SELECT d.offering_id INTO delivery_offering
    FROM course_section_deliveries d
    WHERE d.id = NEW.delivery_id
    FOR SHARE;
    IF delivery_offering IS NULL THEN
      RAISE EXCEPTION 'Assessment delivery does not exist'
        USING ERRCODE = '23503';
    END IF;
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
  BEFORE INSERT OR UPDATE OF lesson_id, delivery_id, max_points ON course_assignments
  FOR EACH ROW EXECUTE FUNCTION db28_guard_assessment_definition();

-- Reverse parent protection. Reparenting empty structure remains possible; once
-- assessment definitions exist, moving a path/lesson would reinterpret their
-- offering identity and is therefore rejected.
CREATE OR REPLACE FUNCTION db30_guard_assessment_upstream_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db30_upstream$
BEGIN
  IF TG_TABLE_NAME = 'course_learning_paths'
     AND NEW.offering_id IS DISTINCT FROM OLD.offering_id
     AND EXISTS (
       SELECT 1
       FROM course_lessons l
       WHERE l.learning_path_id = OLD.id
         AND (
           EXISTS (SELECT 1 FROM course_quizzes q WHERE q.lesson_id = l.id)
           OR EXISTS (SELECT 1 FROM course_assignments a WHERE a.lesson_id = l.id)
         )
     ) THEN
    RAISE EXCEPTION 'Learning path with assessment definitions cannot change offering'
      USING ERRCODE = '23514';
  END IF;

  IF TG_TABLE_NAME = 'course_lessons'
     AND NEW.learning_path_id IS DISTINCT FROM OLD.learning_path_id
     AND (
       EXISTS (SELECT 1 FROM course_quizzes q WHERE q.lesson_id = OLD.id)
       OR EXISTS (SELECT 1 FROM course_assignments a WHERE a.lesson_id = OLD.id)
     ) THEN
    RAISE EXCEPTION 'Lesson with assessment definitions cannot change learning path'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db30_upstream$;

CREATE TRIGGER db30_learning_path_assessment_reparent_guard
  BEFORE UPDATE OF offering_id ON course_learning_paths
  FOR EACH ROW EXECUTE FUNCTION db30_guard_assessment_upstream_reparent();

CREATE TRIGGER db30_lesson_assessment_reparent_guard
  BEFORE UPDATE OF learning_path_id ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION db30_guard_assessment_upstream_reparent();

-- A delivery becomes historical assessment identity as soon as a fixed
-- assessment definition or learner attempt/submission references it.
CREATE OR REPLACE FUNCTION db30_guard_assessment_delivery_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db30_delivery$
BEGIN
  IF (NEW.offering_id, NEW.section_id)
     IS DISTINCT FROM (OLD.offering_id, OLD.section_id)
     AND (
       EXISTS (SELECT 1 FROM course_quizzes q WHERE q.delivery_id = OLD.id)
       OR EXISTS (SELECT 1 FROM course_assignments a WHERE a.delivery_id = OLD.id)
       OR EXISTS (SELECT 1 FROM quiz_attempts qa WHERE qa.delivery_id = OLD.id)
       OR EXISTS (SELECT 1 FROM assignment_submissions s WHERE s.delivery_id = OLD.id)
     ) THEN
    RAISE EXCEPTION 'Assessment-linked delivery cannot change offering/section'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db30_delivery$;

CREATE TRIGGER db30_assessment_delivery_reparent_guard
  BEFORE UPDATE OF offering_id, section_id ON course_section_deliveries
  FOR EACH ROW EXECUTE FUNCTION db30_guard_assessment_delivery_reparent();

-- ---------------------------------------------------------------------------
-- Learner authorization at insert time.
--
-- Core delivery: exact ACTIVE primary section enrollment.
-- Elective-backed delivery: exact ACTIVE elective group roster is authoritative,
-- plus current primary academic eligibility in the elective program/period.
-- A backed-but-archived elective never falls back to host-section access.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db28_guard_learner_delivery(
  p_delivery_id uuid, p_membership_id uuid
) RETURNS void LANGUAGE plpgsql AS $db28_learner$
DECLARE
  delivery_section uuid;
  delivery_college uuid;
  delivery_ended timestamptz;
  offering_status text;
  learner_college uuid;
  elective_group uuid;
  elective_group_status text;
  elective_group_deleted timestamptz;
  elective_slot_program uuid;
  elective_slot_period uuid;
  elective_slot_status text;
  elective_slot_deleted timestamptz;
  elective_offering_status text;
  elective_offering_deleted timestamptz;
  roster_row uuid;
  eligibility_row uuid;
BEGIN
  SELECT d.section_id, dep.college_id, d.ended_at, co.status::text
    INTO delivery_section, delivery_college, delivery_ended, offering_status
  FROM course_section_deliveries d
  JOIN course_offerings co ON co.id = d.offering_id
  JOIN courses c ON c.id = co.course_id
  JOIN departments dep ON dep.id = c.department_id
  WHERE d.id = p_delivery_id
  FOR SHARE OF d;

  IF delivery_section IS NULL OR delivery_college IS NULL
     OR delivery_ended IS NOT NULL OR offering_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Assessment delivery is missing or inactive'
      USING ERRCODE = '23514';
  END IF;

  SELECT m.college_id INTO learner_college
  FROM college_memberships m
  JOIN membership_roles role ON role.membership_id = m.id
    AND role.role = 'LEARNER'
  JOIN users u ON u.id = m.user_id AND u.platform_status = 'ACTIVE'
  WHERE m.id = p_membership_id AND m.status = 'ACTIVE'
  FOR SHARE OF m, role, u;

  IF learner_college IS NULL
     OR learner_college IS DISTINCT FROM delivery_college THEN
    RAISE EXCEPTION 'Assessment learner/delivery tenant mismatch'
      USING ERRCODE = '23514';
  END IF;

  -- Detect any elective binding, including archived bindings, so host-section
  -- enrollment can never become an accidental fallback after archival.
  SELECT eo.group_id, g.status, g.deleted_at,
         es.program_id, es.academic_period_id, es.status, es.deleted_at,
         eo.status, eo.deleted_at
    INTO elective_group, elective_group_status, elective_group_deleted,
         elective_slot_program, elective_slot_period, elective_slot_status,
         elective_slot_deleted, elective_offering_status, elective_offering_deleted
  FROM elective_offerings eo
  JOIN elective_slots es ON es.id = eo.slot_id
  JOIN lms_groups g ON g.id = eo.group_id
  WHERE eo.backed_delivery_id = p_delivery_id
  FOR SHARE OF eo, es, g;

  IF elective_group IS NOT NULL THEN
    IF elective_group_status <> 'ACTIVE'
       OR elective_group_deleted IS NOT NULL
       OR elective_slot_status <> 'ACTIVE'
       OR elective_slot_deleted IS NOT NULL
       OR elective_offering_status <> 'ACTIVE'
       OR elective_offering_deleted IS NOT NULL THEN
      RAISE EXCEPTION 'Elective-backed assessment delivery is not active'
        USING ERRCODE = '23514';
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
        USING ERRCODE = '23514';
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
      AND pd.college_id = delivery_college
      AND (elective_slot_period IS NULL
           OR se.academic_period_id = elective_slot_period)
    LIMIT 1
    FOR SHARE OF lpe, se, home;

    IF eligibility_row IS NULL THEN
      RAISE EXCEPTION 'Learner no longer satisfies elective academic eligibility'
        USING ERRCODE = '23514';
    END IF;

    RETURN;
  END IF;

  SELECT se.id INTO eligibility_row
  FROM section_enrollments se
  JOIN learner_program_enrollments lpe ON lpe.id = se.learner_enrollment_id
  WHERE se.section_id = delivery_section
    AND se.status = 'ACTIVE'
    AND lpe.membership_id = p_membership_id
    AND lpe.status = 'ACTIVE'
  LIMIT 1
  FOR SHARE OF se, lpe;

  IF eligibility_row IS NULL THEN
    RAISE EXCEPTION 'Learner is not actively enrolled in assessment section'
      USING ERRCODE = '23514';
  END IF;
END;
$db28_learner$;

-- ---------------------------------------------------------------------------
-- Quiz attempt history. Lock definition/path/delivery through the definition
-- guard's parent order; learner helper locks current identity/roster state.
-- Once answers exist, attempt attribution cannot be rewritten.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db28_guard_quiz_attempt_parent()
RETURNS trigger LANGUAGE plpgsql AS $db28_attempt$
DECLARE
  lesson_id uuid;
  source_offering uuid;
  attempt_offering uuid;
  fixed_delivery uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND EXISTS (SELECT 1 FROM quiz_attempt_answers aa WHERE aa.attempt_id = OLD.id)
     AND (
       NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
       OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
       OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     ) THEN
    RAISE EXCEPTION 'Quiz attempt with answers has immutable attribution'
      USING ERRCODE = '23514';
  END IF;

  SELECT q.lesson_id, q.delivery_id
    INTO lesson_id, fixed_delivery
  FROM course_quizzes q
  WHERE q.id = NEW.quiz_id
  FOR SHARE;
  IF lesson_id IS NULL THEN
    RAISE EXCEPTION 'Quiz attempt references unknown quiz'
      USING ERRCODE = '23503';
  END IF;

  SELECT lp.offering_id INTO source_offering
  FROM course_lessons l
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  WHERE l.id = lesson_id
  FOR SHARE OF l, lp;

  SELECT d.offering_id INTO attempt_offering
  FROM course_section_deliveries d
  WHERE d.id = NEW.delivery_id
  FOR SHARE;

  IF source_offering IS NULL
     OR attempt_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Quiz attempt is attached to the wrong delivery'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
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

-- ---------------------------------------------------------------------------
-- Assignment grading actor. This mirrors current service authorization:
-- * active SUPER_ADMIN user; OR
-- * active same-college COLLEGE_ADMIN membership; OR
-- * active same-college FACULTY membership with an active teaching assignment
--   for this exact delivery.
--
-- It validates a newly written grade actor, not historical author state. Grade
-- publication currently has no publisher actor column, so publication
-- authorization remains a service-level contract until immutable grade history
-- is promoted from the broader DB06 parity work.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db30_guard_assignment_grader(
  p_delivery_id uuid, p_user_id uuid
) RETURNS void LANGUAGE plpgsql AS $db30_grader$
DECLARE
  delivery_college uuid;
  actor_membership uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Graded assignment requires a grader'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM users u
  WHERE u.id = p_user_id AND u.platform_status = 'ACTIVE'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment grader must be an active user'
      USING ERRCODE = '23514';
  END IF;

  SELECT dep.college_id INTO delivery_college
  FROM course_section_deliveries d
  JOIN course_offerings co ON co.id = d.offering_id
  JOIN courses c ON c.id = co.course_id
  JOIN departments dep ON dep.id = c.department_id
  WHERE d.id = p_delivery_id
  FOR SHARE OF d;
  IF delivery_college IS NULL THEN
    RAISE EXCEPTION 'Assignment grader delivery scope is missing'
      USING ERRCODE = '23503';
  END IF;

  PERFORM 1 FROM system_roles sr
  WHERE sr.user_id = p_user_id AND sr.role = 'SUPER_ADMIN'
  FOR SHARE;
  IF FOUND THEN
    RETURN;
  END IF;

  SELECT cm.id INTO actor_membership
  FROM college_memberships cm
  WHERE cm.user_id = p_user_id
    AND cm.college_id = delivery_college
    AND cm.status = 'ACTIVE'
  FOR SHARE;

  IF actor_membership IS NULL THEN
    RAISE EXCEPTION 'Assignment grader has no active membership in delivery college'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM membership_roles mr
  WHERE mr.membership_id = actor_membership
    AND mr.role = 'COLLEGE_ADMIN'
  FOR SHARE;
  IF FOUND THEN
    RETURN;
  END IF;

  PERFORM 1 FROM membership_roles mr
  WHERE mr.membership_id = actor_membership
    AND mr.role = 'FACULTY'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment grader requires COLLEGE_ADMIN or FACULTY role'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1 FROM course_teaching_assignments ta
  WHERE ta.delivery_id = p_delivery_id
    AND ta.membership_id = actor_membership
    AND ta.ended_at IS NULL
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Faculty grader is not actively assigned to this delivery'
      USING ERRCODE = '23514';
  END IF;
END;
$db30_grader$;

CREATE OR REPLACE FUNCTION db28_guard_assignment_submission_parent()
RETURNS trigger LANGUAGE plpgsql AS $db28_submission$
DECLARE
  lesson_id uuid;
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
      USING ERRCODE = '23514';
  END IF;

  SELECT a.lesson_id, a.delivery_id, a.max_points
    INTO lesson_id, fixed_delivery, max_points
  FROM course_assignments a
  WHERE a.id = NEW.assignment_id
  FOR SHARE;
  IF lesson_id IS NULL THEN
    RAISE EXCEPTION 'Assignment submission references unknown assignment'
      USING ERRCODE = '23503';
  END IF;

  SELECT lp.offering_id INTO source_offering
  FROM course_lessons l
  JOIN course_learning_paths lp ON lp.id = l.learning_path_id
  WHERE l.id = lesson_id
  FOR SHARE OF l, lp;

  SELECT d.offering_id INTO submission_offering
  FROM course_section_deliveries d
  WHERE d.id = NEW.delivery_id
  FOR SHARE;

  IF source_offering IS NULL
     OR submission_offering IS DISTINCT FROM source_offering
     OR (fixed_delivery IS NOT NULL AND fixed_delivery IS DISTINCT FROM NEW.delivery_id) THEN
    RAISE EXCEPTION 'Assignment submission has wrong delivery'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.points_awarded IS NOT NULL
     AND (max_points IS NULL OR NEW.points_awarded > max_points) THEN
    RAISE EXCEPTION 'Assignment grade exceeds assignment maximum points'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM db28_guard_learner_delivery(NEW.delivery_id, NEW.membership_id);
  END IF;

  -- A historical learner may have graduated; grade correction does not
  -- re-check learner roster. It DOES require the newly persisted grader to be
  -- currently authorized whenever grade content/actor is written.
  IF NEW.grading_status = 'GRADED' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM db30_guard_assignment_grader(
        NEW.delivery_id, NEW.graded_by_user_id
      );
    ELSIF NEW.points_awarded IS DISTINCT FROM OLD.points_awarded
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.grading_status IS DISTINCT FROM OLD.grading_status
       OR NEW.graded_by_user_id IS DISTINCT FROM OLD.graded_by_user_id
       OR NEW.graded_at IS DISTINCT FROM OLD.graded_at THEN
      PERFORM db30_guard_assignment_grader(
        NEW.delivery_id, NEW.graded_by_user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$db28_submission$;

CREATE TRIGGER db28_assignment_submission_parent_guard
  BEFORE INSERT OR UPDATE OF
    assignment_id, delivery_id, membership_id, points_awarded, feedback,
    grading_status, graded_by_user_id, graded_at
  ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION db28_guard_assignment_submission_parent();

-- ---------------------------------------------------------------------------
-- Quiz answer history. Lock attempt + question so concurrent reparenting waits.
-- Question reparenting remains allowed until an answer has made that identity
-- historical; after that it is immutable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db28_guard_quiz_answer_parent()
RETURNS trigger LANGUAGE plpgsql AS $db28_answer$
DECLARE
  attempt_quiz uuid;
  question_quiz uuid;
BEGIN
  SELECT a.quiz_id INTO attempt_quiz
  FROM quiz_attempts a
  WHERE a.id = NEW.attempt_id
  FOR SHARE;

  SELECT q.quiz_id INTO question_quiz
  FROM quiz_questions q
  WHERE q.id = NEW.question_id
  FOR SHARE;

  IF attempt_quiz IS NULL OR question_quiz IS NULL
     OR question_quiz IS DISTINCT FROM attempt_quiz THEN
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

CREATE OR REPLACE FUNCTION db30_guard_quiz_question_reparent()
RETURNS trigger LANGUAGE plpgsql AS $db30_question$
BEGIN
  IF NEW.quiz_id IS DISTINCT FROM OLD.quiz_id
     AND EXISTS (
       SELECT 1 FROM quiz_attempt_answers aa WHERE aa.question_id = OLD.id
     ) THEN
    RAISE EXCEPTION 'Answered quiz question cannot move to another quiz'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db30_question$;

CREATE TRIGGER db30_quiz_question_reparent_guard
  BEFORE UPDATE OF quiz_id ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION db30_guard_quiz_question_reparent();

-- ---------------------------------------------------------------------------
-- Promotion boundary / remaining proof.
--
-- Locking model:
-- 1. child writes SHARE-lock their definition and structural parents;
-- 2. learner writes SHARE-lock identity + exact current roster source;
-- 3. reverse parent UPDATE guards observe committed children after those locks;
-- 4. grading writes SHARE-lock the current actor authorization chain.
--
-- This follows DB02's explicit SHARE-vs-NO-KEY-UPDATE serialization model.
-- DB05's course-parent advisory lock is independent and should not be acquired
-- by these assessment functions, avoiding a cross-domain advisory/row-lock cycle.
--
-- Still required before registration:
-- * reconcile exact generated migration order after DB02/DB03/DB05 promotions;
-- * execute all DB06 wrong-parent, core/elective roster, historical correction,
--   grader-role and poisoned-preflight witnesses;
-- * execute both commit orders for enrollment/group-role revocation vs child
--   insert and path/lesson/delivery/question reparent vs child insert;
-- * verify no deadlocks under the supported isolation policy;
-- * keep grade-publication authorization in service until a persisted publisher
--   / immutable grade-history model is promoted.
--
-- PostgreSQL/runtime evidence remains NOT EXECUTED in this source candidate.
