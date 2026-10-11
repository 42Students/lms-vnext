-- DB-038 / DB06 SOURCE-ONLY CANDIDATE. DO NOT REGISTER INDEPENDENTLY.
-- Complements registered 0041/0042 tenant/parent/grader guards.
-- Source facts: vNext submitCourseQuiz writes final attempt score + answer
-- snapshots once; assignment learner payload is insert-once while grading fields
-- remain mutable. Legacy QuizService soft-deletes the quiz specifically to
-- preserve grading/attempt history and no active attempt/answer deletion
-- producer was found in the pinned source review.

CREATE FUNCTION db06_reject_submitted_assessment_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $db06_history_immutable$
BEGIN
  RAISE EXCEPTION 'DB06 submitted assessment history is immutable'
    USING ERRCODE='23514';
END;
$db06_history_immutable$;

CREATE TRIGGER db06_quiz_attempts_no_update_delete
BEFORE UPDATE OR DELETE ON quiz_attempts
FOR EACH ROW EXECUTE FUNCTION db06_reject_submitted_assessment_history_mutation();

CREATE TRIGGER db06_quiz_attempts_no_truncate
BEFORE TRUNCATE ON quiz_attempts
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_submitted_assessment_history_mutation();

CREATE TRIGGER db06_quiz_attempt_answers_no_update_delete
BEFORE UPDATE OR DELETE ON quiz_attempt_answers
FOR EACH ROW EXECUTE FUNCTION db06_reject_submitted_assessment_history_mutation();

CREATE TRIGGER db06_quiz_attempt_answers_no_truncate
BEFORE TRUNCATE ON quiz_attempt_answers
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_submitted_assessment_history_mutation();

CREATE FUNCTION db06_guard_assignment_submission_payload_immutable()
RETURNS trigger LANGUAGE plpgsql AS $db06_submission_payload$
BEGIN
  IF NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
     OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     OR NEW.submission_type IS DISTINCT FROM OLD.submission_type
     OR NEW.text_content IS DISTINCT FROM OLD.text_content
     OR NEW.submission_url IS DISTINCT FROM OLD.submission_url
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'DB06 learner assignment submission payload is immutable'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_submission_payload$;

CREATE TRIGGER db06_assignment_submission_payload_immutable
BEFORE UPDATE ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION db06_guard_assignment_submission_payload_immutable();

CREATE TRIGGER db06_assignment_submissions_no_delete
BEFORE DELETE ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION db06_reject_submitted_assessment_history_mutation();

CREATE TRIGGER db06_assignment_submissions_no_truncate
BEFORE TRUNCATE ON assignment_submissions
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_submitted_assessment_history_mutation();

CREATE FUNCTION db06_guard_quiz_history_definition()
RETURNS trigger LANGUAGE plpgsql AS $db06_quiz_history_definition$
BEGIN
  IF EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = OLD.id)
     AND (
       NEW.max_attempts IS DISTINCT FROM OLD.max_attempts
       OR NEW.total_points IS DISTINCT FROM OLD.total_points
     ) THEN
    RAISE EXCEPTION 'DB06 quiz scoring definition is immutable after attempts'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_quiz_history_definition$;

CREATE TRIGGER db06_quiz_history_definition_guard
BEFORE UPDATE OF max_attempts, total_points ON course_quizzes
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_history_definition();

CREATE FUNCTION db06_guard_quiz_question_authoring()
RETURNS trigger LANGUAGE plpgsql AS $db06_question_authoring$
DECLARE
  target_quiz uuid;
  target_status text;
BEGIN
  target_quiz := CASE WHEN TG_OP = 'DELETE' THEN OLD.quiz_id ELSE NEW.quiz_id END;
  SELECT q.status::text INTO target_status
    FROM course_quizzes q
    WHERE q.id = target_quiz
    FOR SHARE;

  IF target_status IS NULL THEN
    RAISE EXCEPTION 'DB06 quiz question parent is missing' USING ERRCODE='23503';
  END IF;
  IF target_status <> 'DRAFT'
     OR EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = target_quiz) THEN
    RAISE EXCEPTION 'DB06 quiz questions are immutable outside attempt-free DRAFT'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.quiz_id IS DISTINCT FROM OLD.quiz_id THEN
    PERFORM 1 FROM course_quizzes q
      WHERE q.id = OLD.quiz_id
        AND q.status = 'DRAFT'
        AND NOT EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = OLD.quiz_id)
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 source quiz is not mutable for question reparent'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$db06_question_authoring$;

CREATE TRIGGER db06_quiz_question_authoring_guard
BEFORE INSERT OR UPDATE OR DELETE ON quiz_questions
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_question_authoring();

CREATE FUNCTION db06_guard_quiz_option_authoring()
RETURNS trigger LANGUAGE plpgsql AS $db06_option_authoring$
DECLARE
  target_question uuid;
  target_quiz uuid;
  target_status text;
BEGIN
  target_question := CASE WHEN TG_OP = 'DELETE' THEN OLD.question_id ELSE NEW.question_id END;
  SELECT qq.quiz_id, q.status::text INTO target_quiz, target_status
    FROM quiz_questions qq
    JOIN course_quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = target_question
    FOR SHARE OF qq, q;

  IF target_quiz IS NULL THEN
    RAISE EXCEPTION 'DB06 quiz option parent question is missing' USING ERRCODE='23503';
  END IF;
  IF target_status <> 'DRAFT'
     OR EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = target_quiz) THEN
    RAISE EXCEPTION 'DB06 quiz options are immutable outside attempt-free DRAFT'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.question_id IS DISTINCT FROM OLD.question_id THEN
    PERFORM 1
      FROM quiz_questions qq
      JOIN course_quizzes q ON q.id = qq.quiz_id
      WHERE qq.id = OLD.question_id
        AND q.status = 'DRAFT'
        AND NOT EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = q.id)
      FOR SHARE OF qq, q;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 source quiz is not mutable for option reparent'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$db06_option_authoring$;

CREATE TRIGGER db06_quiz_option_authoring_guard
BEFORE INSERT OR UPDATE OR DELETE ON quiz_options
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_option_authoring();

-- Required promotion witnesses:
-- A attempt UPDATE/DELETE/TRUNCATE fails;
-- B answer UPDATE/DELETE/TRUNCATE fails;
-- C assignment grade/feedback/version mutation remains allowed;
-- D learner submission payload mutation and DELETE/TRUNCATE fail;
-- E DRAFT no-attempt question/option authoring remains allowed;
-- F non-DRAFT or post-attempt question/option authoring fails;
-- G max_attempts/total_points mutation after attempts fails;
-- H attempt INSERT vs authoring race serializes without history reinterpretation.
