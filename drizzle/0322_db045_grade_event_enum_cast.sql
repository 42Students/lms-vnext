-- DB045 follow-up: existing assignment_submissions.grading_status is a
-- PostgreSQL enum; the 0205 immutable event snapshot stores varchar(24).
-- Compare the canonical textual status rather than enum-to-varchar (42883).
-- Replace only the body of the registered deferred trigger function.
CREATE OR REPLACE FUNCTION db06_require_assignment_grade_event()
RETURNS trigger LANGUAGE plpgsql AS $db06_require_grade$
DECLARE
  expected_action text;
BEGIN
  IF NEW.points_awarded IS NOT DISTINCT FROM OLD.points_awarded
     AND NEW.feedback IS NOT DISTINCT FROM OLD.feedback
     AND NEW.grading_status IS NOT DISTINCT FROM OLD.grading_status
     AND NEW.grade_published IS NOT DISTINCT FROM OLD.grade_published
     AND NEW.graded_by_user_id IS NOT DISTINCT FROM OLD.graded_by_user_id
     AND NEW.graded_at IS NOT DISTINCT FROM OLD.graded_at THEN
    RETURN NEW;
  END IF;

  expected_action := CASE
    WHEN OLD.grade_published = false AND NEW.grade_published = true
      THEN 'PUBLISH_GRADE'
    WHEN OLD.grade_published = true AND NEW.grade_published = false
         AND OLD.points_awarded IS NOT DISTINCT FROM NEW.points_awarded
         AND OLD.feedback IS NOT DISTINCT FROM NEW.feedback
         AND OLD.grading_status IS NOT DISTINCT FROM NEW.grading_status
         AND OLD.graded_by_user_id IS NOT DISTINCT FROM NEW.graded_by_user_id
         AND OLD.graded_at IS NOT DISTINCT FROM NEW.graded_at
      THEN 'HIDE_GRADE'
    WHEN OLD.grading_status = 'NOT_GRADED' AND NEW.grading_status = 'GRADED'
      THEN 'GRADE'
    ELSE 'REGRADE'
  END;

  IF NOT EXISTS (
    SELECT 1
      FROM assignment_grade_events e
      WHERE e.assignment_submission_id = NEW.id
        AND e.assignment_id = NEW.assignment_id
        AND e.delivery_id = NEW.delivery_id
        AND e.learner_membership_id = NEW.membership_id
        AND e.action = expected_action
        AND e.previous_points IS NOT DISTINCT FROM OLD.points_awarded
        AND e.new_points IS NOT DISTINCT FROM NEW.points_awarded
        AND e.previous_feedback IS NOT DISTINCT FROM OLD.feedback
        AND e.new_feedback IS NOT DISTINCT FROM NEW.feedback
        AND e.previous_graded_by_user_id IS NOT DISTINCT FROM OLD.graded_by_user_id
        AND e.new_graded_by_user_id IS NOT DISTINCT FROM NEW.graded_by_user_id
        AND e.previous_graded_at IS NOT DISTINCT FROM OLD.graded_at
        AND e.new_graded_at IS NOT DISTINCT FROM NEW.graded_at
        AND e.previous_grading_status = OLD.grading_status::text
        AND e.new_grading_status = NEW.grading_status::text
        AND e.previous_grade_published = OLD.grade_published
        AND e.new_grade_published = NEW.grade_published
        AND e.submission_version_before = OLD.version
        AND e.submission_version_after = NEW.version
        AND (
          expected_action IN ('PUBLISH_GRADE','HIDE_GRADE')
          OR e.actor_user_id = NEW.graded_by_user_id
        )
  ) THEN
    RAISE EXCEPTION 'DB06 grading mutation missing immutable audit event'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_require_grade$;
