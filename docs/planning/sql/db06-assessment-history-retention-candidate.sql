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

-- Serialize direct SQL attempts with the same advisory-lock namespace used by
-- submitCourseQuiz. This makes maxAttempts and sequential numbering a DB invariant.
CREATE FUNCTION db06_guard_quiz_attempt_sequence()
RETURNS trigger LANGUAGE plpgsql AS $db06_attempt_sequence$
DECLARE
  used integer;
  allowed integer;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext(NEW.quiz_id::text || ':' || NEW.membership_id::text),
    6206001
  );

  SELECT q.max_attempts INTO allowed
  FROM course_quizzes q
  WHERE q.id = NEW.quiz_id
  FOR SHARE;

  IF allowed IS NULL THEN
    RAISE EXCEPTION 'DB06 quiz attempt parent is missing'
      USING ERRCODE='23503';
  END IF;

  SELECT count(*) INTO used
  FROM quiz_attempts a
  WHERE a.quiz_id = NEW.quiz_id
    AND a.membership_id = NEW.membership_id;

  IF used >= allowed THEN
    RAISE EXCEPTION 'DB06 quiz max attempts reached'
      USING ERRCODE='23514';
  END IF;
  IF NEW.attempt_number <> used + 1 THEN
    RAISE EXCEPTION 'DB06 quiz attempt number must be sequential'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_attempt_sequence$;

CREATE TRIGGER db06_quiz_attempt_sequence_guard
BEFORE INSERT ON quiz_attempts
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_attempt_sequence();

-- Keep the stored denominator equal to the authored question-point sum.
-- Deferred checks allow create/update code to write quiz/questions in either
-- order inside one transaction.
CREATE FUNCTION db06_require_quiz_total_points()
RETURNS trigger LANGUAGE plpgsql AS $db06_quiz_total$
DECLARE
  target_quiz uuid;
  configured integer;
  authored integer;
BEGIN
  target_quiz := CASE
    WHEN TG_TABLE_NAME = 'course_quizzes' THEN
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
    ELSE
      CASE WHEN TG_OP = 'DELETE' THEN OLD.quiz_id ELSE NEW.quiz_id END
  END;

  SELECT q.total_points INTO configured
  FROM course_quizzes q
  WHERE q.id = target_quiz;

  IF configured IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT COALESCE(sum(qq.points), 0) INTO authored
  FROM quiz_questions qq
  WHERE qq.quiz_id = target_quiz;

  IF authored <= 0 OR configured <> authored THEN
    RAISE EXCEPTION 'DB06 quiz total points do not match authored questions'
      USING ERRCODE='23514';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$db06_quiz_total$;

CREATE CONSTRAINT TRIGGER db06_quiz_total_points_from_quiz
AFTER INSERT OR UPDATE ON course_quizzes
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION db06_require_quiz_total_points();

CREATE CONSTRAINT TRIGGER db06_quiz_total_points_from_questions
AFTER INSERT OR UPDATE OR DELETE ON quiz_questions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION db06_require_quiz_total_points();

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
    FOR UPDATE;

  IF target_status IS NULL THEN
    RAISE EXCEPTION 'DB06 quiz question parent is missing' USING ERRCODE='23503';
  END IF;
  IF target_status <> 'DRAFT'
     OR EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = target_quiz) THEN
    RAISE EXCEPTION 'DB06 quiz questions are immutable outside attempt-free DRAFT'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.quiz_id IS DISTINCT FROM OLD.quiz_id THEN
    RAISE EXCEPTION 'DB06 quiz question parent is immutable'
      USING ERRCODE='23514';
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
    FOR SHARE OF qq
    FOR UPDATE OF q;

  IF target_quiz IS NULL THEN
    RAISE EXCEPTION 'DB06 quiz option parent question is missing' USING ERRCODE='23503';
  END IF;
  IF target_status <> 'DRAFT'
     OR EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_id = target_quiz) THEN
    RAISE EXCEPTION 'DB06 quiz options are immutable outside attempt-free DRAFT'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.question_id IS DISTINCT FROM OLD.question_id THEN
    RAISE EXCEPTION 'DB06 quiz option parent is immutable'
      USING ERRCODE='23514';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$db06_option_authoring$;

CREATE TRIGGER db06_quiz_option_authoring_guard
BEFORE INSERT OR UPDATE OR DELETE ON quiz_options
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_option_authoring();

-- Snapshot fidelity ---------------------------------------------------------
-- submitCourseQuiz currently materializes question/option rows before opening
-- its write transaction. A concurrent authoring transaction could therefore
-- commit between that read and the attempt INSERT. Validate every persisted
-- answer against the database definition that is current at INSERT time.
CREATE FUNCTION db06_guard_quiz_answer_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $db06_answer_snapshot$
DECLARE
  q_quiz uuid;
  q_type text;
  q_prompt text;
  q_points integer;
  canonical_options jsonb;
  selected_count integer;
  distinct_selected_count integer;
  invalid_selected_count integer;
  correct_option_count integer;
  selected_correct_count integer;
  selected_incorrect_count integer;
  expected_correct boolean;
BEGIN
  SELECT q.quiz_id, q.question_type::text, q.prompt, q.points
    INTO q_quiz, q_type, q_prompt, q_points
    FROM quiz_questions q
    WHERE q.id = NEW.question_id
    FOR SHARE;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'id', o.id::text,
               'text', o.option_text,
               'sequence', o.sequence,
               'correct', o.is_correct
             )
             ORDER BY o.sequence, o.id
           ),
           '[]'::jsonb
         )
    INTO canonical_options
    FROM quiz_options o
    WHERE o.question_id = NEW.question_id;

  IF q_quiz IS NULL THEN
    RAISE EXCEPTION 'DB06 answer snapshot question is missing'
      USING ERRCODE='23503';
  END IF;

  PERFORM 1
    FROM quiz_attempts a
    WHERE a.id = NEW.attempt_id
      AND a.quiz_id = q_quiz
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB06 answer snapshot question belongs to another quiz'
      USING ERRCODE='23514';
  END IF;

  IF NEW.question_type::text IS DISTINCT FROM q_type
     OR NEW.prompt_snapshot IS DISTINCT FROM q_prompt
     OR NEW.points_possible IS DISTINCT FROM q_points
     OR NEW.options_snapshot IS DISTINCT FROM canonical_options THEN
    RAISE EXCEPTION 'DB06 answer snapshot does not match committed quiz definition'
      USING ERRCODE='23514';
  END IF;

  SELECT count(*), count(DISTINCT value)
    INTO selected_count, distinct_selected_count
    FROM jsonb_array_elements_text(NEW.selected_option_ids);

  IF selected_count <> distinct_selected_count THEN
    RAISE EXCEPTION 'DB06 answer contains duplicate selected option ids'
      USING ERRCODE='23514';
  END IF;

  SELECT count(*)
    INTO invalid_selected_count
    FROM jsonb_array_elements_text(NEW.selected_option_ids) selected(value)
    WHERE NOT EXISTS (
      SELECT 1
      FROM quiz_options o
      WHERE o.question_id = NEW.question_id
        AND o.id::text = selected.value
    );

  IF invalid_selected_count > 0 THEN
    RAISE EXCEPTION 'DB06 answer contains option outside committed question'
      USING ERRCODE='23514';
  END IF;

  IF q_type = 'SINGLE_CHOICE' AND selected_count > 1 THEN
    RAISE EXCEPTION 'DB06 single-choice answer selected multiple options'
      USING ERRCODE='23514';
  END IF;

  SELECT
      count(*) FILTER (WHERE o.is_correct),
      count(*) FILTER (
        WHERE o.is_correct
          AND NEW.selected_option_ids ? o.id::text
      ),
      count(*) FILTER (
        WHERE NOT o.is_correct
          AND NEW.selected_option_ids ? o.id::text
      )
    INTO correct_option_count, selected_correct_count, selected_incorrect_count
    FROM quiz_options o
    WHERE o.question_id = NEW.question_id;

  expected_correct :=
    selected_count > 0
    AND selected_incorrect_count = 0
    AND selected_correct_count = correct_option_count;

  IF NEW.correct IS DISTINCT FROM expected_correct
     OR NEW.points_awarded IS DISTINCT FROM
       (CASE WHEN expected_correct THEN q_points ELSE 0 END) THEN
    RAISE EXCEPTION 'DB06 answer correctness/points do not match committed options'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_answer_snapshot$;

CREATE TRIGGER db06_quiz_answer_snapshot_guard
BEFORE INSERT ON quiz_attempt_answers
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_answer_snapshot();

-- A committed attempt must contain exactly one answer snapshot per current
-- question (including unanswered questions, represented by []), and aggregate
-- scores must equal the persisted answer snapshots and quiz total_points.
CREATE FUNCTION db06_require_complete_quiz_attempt()
RETURNS trigger LANGUAGE plpgsql AS $db06_complete_attempt$
DECLARE
  question_count integer;
  answer_count integer;
  answer_score integer;
  answer_max integer;
  quiz_total integer;
BEGIN
  SELECT q.total_points,
         (SELECT count(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)
    INTO quiz_total, question_count
    FROM course_quizzes q
    WHERE q.id = NEW.quiz_id
    FOR SHARE;

  SELECT count(*),
         COALESCE(sum(points_awarded), 0),
         COALESCE(sum(points_possible), 0)
    INTO answer_count, answer_score, answer_max
    FROM quiz_attempt_answers
    WHERE attempt_id = NEW.id;

  IF question_count <= 0
     OR answer_count <> question_count
     OR answer_score <> NEW.score
     OR answer_max <> NEW.max_score
     OR quiz_total <> NEW.max_score THEN
    RAISE EXCEPTION 'DB06 quiz attempt is missing or inconsistent answer snapshots'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_complete_attempt$;

CREATE CONSTRAINT TRIGGER db06_complete_quiz_attempt_required
AFTER INSERT ON quiz_attempts
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION db06_require_complete_quiz_attempt();

-- Non-destructive promotion preflight. Refuse to install retention guards over
-- already-poisoned historical rows.
DO $db06_retention_preflight$
DECLARE
  bad_attempt uuid;
BEGIN
  SELECT a.id INTO bad_attempt
    FROM quiz_attempts a
    JOIN course_quizzes q ON q.id = a.quiz_id
    LEFT JOIN LATERAL (
      SELECT count(*) AS answer_count,
             COALESCE(sum(aa.points_awarded), 0) AS answer_score,
             COALESCE(sum(aa.points_possible), 0) AS answer_max
      FROM quiz_attempt_answers aa
      WHERE aa.attempt_id = a.id
    ) x ON true
    LEFT JOIN LATERAL (
      SELECT count(*) AS question_count
      FROM quiz_questions qq
      WHERE qq.quiz_id = a.quiz_id
    ) qc ON true
    WHERE qc.question_count <= 0
       OR x.answer_count <> qc.question_count
       OR x.answer_score <> a.score
       OR x.answer_max <> a.max_score
       OR q.total_points <> a.max_score
    LIMIT 1;

  IF bad_attempt IS NOT NULL THEN
    RAISE EXCEPTION 'DB06 retention preflight: inconsistent quiz attempt %', bad_attempt
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM quiz_attempt_answers aa
    JOIN quiz_questions qq ON qq.id = aa.question_id
    JOIN quiz_attempts a ON a.id = aa.attempt_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(
               jsonb_agg(
                 jsonb_build_object(
                   'id', o.id::text,
                   'text', o.option_text,
                   'sequence', o.sequence,
                   'correct', o.is_correct
                 )
                 ORDER BY o.sequence, o.id
               ),
               '[]'::jsonb
             ) AS canonical_options
      FROM quiz_options o
      WHERE o.question_id = aa.question_id
    ) snapshot ON true
    WHERE qq.quiz_id IS DISTINCT FROM a.quiz_id
       OR aa.question_type::text IS DISTINCT FROM qq.question_type::text
       OR aa.prompt_snapshot IS DISTINCT FROM qq.prompt
       OR aa.points_possible IS DISTINCT FROM qq.points
       OR aa.options_snapshot IS DISTINCT FROM snapshot.canonical_options
  ) THEN
    RAISE EXCEPTION 'DB06 retention preflight: answer snapshots mismatch committed definition'
      USING ERRCODE='23514';
  END IF;
END;
$db06_retention_preflight$;

-- Required promotion witnesses:
-- A attempt UPDATE/DELETE/TRUNCATE fails;
-- B answer UPDATE/DELETE/TRUNCATE fails;
-- C assignment grade/feedback/version mutation remains allowed;
-- D learner submission payload mutation and DELETE/TRUNCATE fail;
-- E DRAFT no-attempt question/option authoring remains allowed;
-- F non-DRAFT or post-attempt question/option authoring fails;
-- G max_attempts/total_points mutation after attempts fails;
-- H attempt INSERT vs authoring race serializes without history reinterpretation.
-- I stale answer snapshot/options/correctness/points INSERT fails.
-- J attempt without exactly one answer per question fails at COMMIT.
-- K attempt score/max_score must equal answer sums/current quiz total_points.
-- L preflight refuses existing inconsistent attempt/answer history.

-- Additional acceptance:
-- M direct SQL attempt_number gaps or max-attempt overflow fail.
-- N service/direct attempt races share advisory lock namespace 6206001.
-- O quiz total_points must equal sum(question.points) at COMMIT.
