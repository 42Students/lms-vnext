-- DB-052 / DB06 SOURCE-ONLY CANDIDATE. DO NOT REGISTER INDEPENDENTLY.
--
-- Complements registered 0041/0042 and staged DB038 retention.
-- Runtime producer cutover is required in the same compatible release because
-- lifecycle completeness triggers reject status/result changes without events.

-- Preflight current state before adding any history semantics.
DO $db06_quiz_lifecycle_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM course_quizzes q
    LEFT JOIN course_lessons l ON l.id = q.lesson_id
    LEFT JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    LEFT JOIN course_offerings co ON co.id = lp.offering_id
    LEFT JOIN courses c ON c.id = co.course_id
    LEFT JOIN departments dep ON dep.id = c.department_id
    WHERE dep.id IS NULL
  ) THEN
    RAISE EXCEPTION 'DB06 lifecycle preflight: quiz cannot derive tenant scope'
      USING ERRCODE='23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM course_quizzes
    WHERE results_published = true
      AND status::text NOT IN ('CLOSED','ARCHIVED')
  ) THEN
    RAISE EXCEPTION 'DB06 lifecycle preflight: published results outside CLOSED/ARCHIVED state'
      USING ERRCODE='23514';
  END IF;
END;
$db06_quiz_lifecycle_preflight$;

ALTER TABLE course_quizzes
  ADD COLUMN lifecycle_version integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT course_quizzes_lifecycle_version_ck
    CHECK (lifecycle_version >= 0);

CREATE TABLE course_quiz_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL
    REFERENCES course_quizzes(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL
    REFERENCES colleges(id) ON DELETE RESTRICT,
  delivery_id uuid
    REFERENCES course_section_deliveries(id) ON DELETE RESTRICT,
  actor_user_id uuid
    REFERENCES users(id) ON DELETE RESTRICT,
  actor_membership_id uuid
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  actor_role varchar(32),
  action varchar(32) NOT NULL,
  previous_status varchar(24),
  new_status varchar(24) NOT NULL,
  previous_results_published boolean,
  new_results_published boolean NOT NULL,
  lifecycle_version_before integer,
  lifecycle_version_after integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT course_quiz_lifecycle_events_action_ck
    CHECK (
      action IN (
        'BASELINE','CREATE','PUBLISH','UNPUBLISH','CLOSE','ARCHIVE',
        'RESULTS_PUBLISH','RESULTS_UNPUBLISH'
      )
    ),
  CONSTRAINT course_quiz_lifecycle_events_status_ck
    CHECK (
      new_status IN ('DRAFT','PUBLISHED','CLOSED','ARCHIVED')
      AND (
        previous_status IS NULL
        OR previous_status IN ('DRAFT','PUBLISHED','CLOSED','ARCHIVED')
      )
      AND (
        new_results_published = false
        OR new_status IN ('CLOSED','ARCHIVED')
      )
    ),
  CONSTRAINT course_quiz_lifecycle_events_actor_ck
    CHECK (
      (
        action = 'BASELINE'
        AND actor_user_id IS NULL
        AND actor_membership_id IS NULL
        AND actor_role IS NULL
      )
      OR
      (
        action <> 'BASELINE'
        AND actor_user_id IS NOT NULL
        AND actor_role IN ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY')
        AND (
          (actor_role = 'SUPER_ADMIN' AND actor_membership_id IS NULL)
          OR
          (actor_role IN ('COLLEGE_ADMIN','FACULTY')
           AND actor_membership_id IS NOT NULL)
        )
      )
    ),
  CONSTRAINT course_quiz_lifecycle_events_version_ck
    CHECK (
      (
        action IN ('BASELINE','CREATE')
        AND lifecycle_version_before IS NULL
        AND lifecycle_version_after = 0
      )
      OR
      (
        action NOT IN ('BASELINE','CREATE')
        AND lifecycle_version_before IS NOT NULL
        AND lifecycle_version_before >= 0
        AND lifecycle_version_after = lifecycle_version_before + 1
      )
    ),
  CONSTRAINT course_quiz_lifecycle_events_shape_ck
    CHECK (
      (
        action = 'BASELINE'
        AND previous_status IS NULL
        AND previous_results_published IS NULL
      )
      OR
      (
        action = 'CREATE'
        AND previous_status IS NULL
        AND new_status = 'DRAFT'
        AND previous_results_published IS NULL
        AND new_results_published = false
      )
      OR
      (
        action = 'PUBLISH'
        AND previous_status = 'DRAFT'
        AND new_status = 'PUBLISHED'
        AND previous_results_published = false
        AND new_results_published = false
      )
      OR
      (
        action = 'UNPUBLISH'
        AND previous_status = 'PUBLISHED'
        AND new_status = 'DRAFT'
        AND previous_results_published = false
        AND new_results_published = false
      )
      OR
      (
        action = 'CLOSE'
        AND previous_status = 'PUBLISHED'
        AND new_status = 'CLOSED'
        AND previous_results_published = false
        AND new_results_published = false
      )
      OR
      (
        action = 'ARCHIVE'
        AND previous_status IN ('DRAFT','PUBLISHED','CLOSED')
        AND new_status = 'ARCHIVED'
        AND previous_results_published IS NOT DISTINCT FROM new_results_published
      )
      OR
      (
        action = 'RESULTS_PUBLISH'
        AND previous_status = 'CLOSED'
        AND new_status = 'CLOSED'
        AND previous_results_published = false
        AND new_results_published = true
      )
      OR
      (
        action = 'RESULTS_UNPUBLISH'
        AND previous_status = new_status
        AND previous_status IN ('CLOSED','ARCHIVED')
        AND previous_results_published = true
        AND new_results_published = false
      )
    )
);

CREATE UNIQUE INDEX course_quiz_lifecycle_events_quiz_version_uq
  ON course_quiz_lifecycle_events(quiz_id, lifecycle_version_after);
CREATE INDEX course_quiz_lifecycle_events_quiz_time_idx
  ON course_quiz_lifecycle_events(quiz_id, occurred_at);
CREATE INDEX course_quiz_lifecycle_events_college_time_idx
  ON course_quiz_lifecycle_events(college_id, occurred_at);
CREATE INDEX course_quiz_lifecycle_events_actor_time_idx
  ON course_quiz_lifecycle_events(actor_user_id, occurred_at);

-- Actor/tenant/audience scope ----------------------------------------------

CREATE FUNCTION db06_guard_quiz_lifecycle_event_scope()
RETURNS trigger LANGUAGE plpgsql AS $db06_quiz_lifecycle_scope$
DECLARE
  quiz_college uuid;
  quiz_delivery uuid;
  quiz_creator uuid;
  membership_college uuid;
  membership_user uuid;
BEGIN
  SELECT dep.college_id, q.delivery_id, q.created_by_user_id
    INTO quiz_college, quiz_delivery, quiz_creator
    FROM course_quizzes q
    JOIN course_lessons l ON l.id = q.lesson_id
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    JOIN course_offerings co ON co.id = lp.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN departments dep ON dep.id = c.department_id
    WHERE q.id = NEW.quiz_id
    FOR SHARE OF q, l, lp, co, c, dep;

  IF quiz_college IS NULL
     OR NEW.college_id IS DISTINCT FROM quiz_college
     OR NEW.delivery_id IS DISTINCT FROM quiz_delivery THEN
    RAISE EXCEPTION 'DB06 quiz lifecycle event tenant/audience mismatch'
      USING ERRCODE='23514';
  END IF;

  IF NEW.action = 'BASELINE' THEN
    RETURN NEW;
  END IF;

  PERFORM 1
    FROM users u
    WHERE u.id = NEW.actor_user_id
      AND u.platform_status = 'ACTIVE'
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB06 quiz lifecycle actor must be an active user'
      USING ERRCODE='23514';
  END IF;

  IF NEW.action = 'CREATE'
     AND NEW.actor_user_id IS DISTINCT FROM quiz_creator THEN
    RAISE EXCEPTION 'DB06 quiz CREATE event actor must equal created_by_user_id'
      USING ERRCODE='23514';
  END IF;

  IF NEW.actor_role = 'SUPER_ADMIN' THEN
    IF NEW.actor_membership_id IS NOT NULL THEN
      RAISE EXCEPTION 'DB06 SUPER_ADMIN lifecycle actor must not claim tenant membership'
        USING ERRCODE='23514';
    END IF;

    PERFORM 1
      FROM system_roles sr
      WHERE sr.user_id = NEW.actor_user_id
        AND sr.role = 'SUPER_ADMIN'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 quiz lifecycle actor lacks persisted SUPER_ADMIN role'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  SELECT cm.college_id, cm.user_id
    INTO membership_college, membership_user
    FROM college_memberships cm
    WHERE cm.id = NEW.actor_membership_id
      AND cm.status = 'ACTIVE'
    FOR SHARE;

  IF membership_college IS DISTINCT FROM quiz_college
     OR membership_user IS DISTINCT FROM NEW.actor_user_id THEN
    RAISE EXCEPTION 'DB06 quiz lifecycle actor membership mismatch'
      USING ERRCODE='23514';
  END IF;

  IF NEW.actor_role = 'COLLEGE_ADMIN' THEN
    PERFORM 1
      FROM membership_roles mr
      WHERE mr.membership_id = NEW.actor_membership_id
        AND mr.role = 'COLLEGE_ADMIN'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 quiz lifecycle actor lacks COLLEGE_ADMIN role'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.actor_role = 'FACULTY' THEN
    IF quiz_delivery IS NULL THEN
      RAISE EXCEPTION 'DB06 generic quiz lifecycle requires college-admin scope'
        USING ERRCODE='23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
      JOIN course_teaching_assignments cta
        ON cta.membership_id = mr.membership_id
       AND cta.delivery_id = quiz_delivery
       AND cta.ended_at IS NULL
      WHERE mr.membership_id = NEW.actor_membership_id
        AND mr.role = 'FACULTY'
      FOR SHARE OF mr, cta;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 faculty lifecycle actor is not assigned to quiz delivery'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'DB06 unsupported quiz lifecycle actor role'
    USING ERRCODE='23514';
END;
$db06_quiz_lifecycle_scope$;

CREATE TRIGGER db06_quiz_lifecycle_event_scope_guard
BEFORE INSERT ON course_quiz_lifecycle_events
FOR EACH ROW EXECUTE FUNCTION db06_guard_quiz_lifecycle_event_scope();

-- Honest baseline for rows that pre-date lifecycle events. No actor is claimed.
INSERT INTO course_quiz_lifecycle_events (
  quiz_id,
  college_id,
  delivery_id,
  actor_user_id,
  actor_membership_id,
  actor_role,
  action,
  previous_status,
  new_status,
  previous_results_published,
  new_results_published,
  lifecycle_version_before,
  lifecycle_version_after,
  occurred_at
)
SELECT
  q.id,
  dep.college_id,
  q.delivery_id,
  NULL,
  NULL,
  NULL,
  'BASELINE',
  NULL,
  q.status::text,
  NULL,
  q.results_published,
  NULL,
  0,
  q.created_at
FROM course_quizzes q
JOIN course_lessons l ON l.id = q.lesson_id
JOIN course_learning_paths lp ON lp.id = l.learning_path_id
JOIN course_offerings co ON co.id = lp.offering_id
JOIN courses c ON c.id = co.course_id
JOIN departments dep ON dep.id = c.department_id;

-- Row lifecycle state machine ----------------------------------------------

CREATE FUNCTION db06_guard_course_quiz_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $db06_quiz_lifecycle$
DECLARE
  has_questions boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text <> 'DRAFT'
       OR NEW.results_published <> false
       OR NEW.lifecycle_version <> 0 THEN
      RAISE EXCEPTION 'DB06 new quiz must start DRAFT, unpublished, lifecycle version 0'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.results_published = true
     AND NEW.status::text NOT IN ('CLOSED','ARCHIVED') THEN
    RAISE EXCEPTION 'DB06 published quiz results require CLOSED or ARCHIVED state'
      USING ERRCODE='23514';
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.results_published IS NOT DISTINCT FROM OLD.results_published THEN
    IF NEW.lifecycle_version IS DISTINCT FROM OLD.lifecycle_version THEN
      RAISE EXCEPTION 'DB06 lifecycle version cannot change without lifecycle mutation'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.results_published IS DISTINCT FROM OLD.results_published THEN
    RAISE EXCEPTION 'DB06 status and result visibility must transition separately'
      USING ERRCODE='23514';
  END IF;

  IF NEW.lifecycle_version <> OLD.lifecycle_version + 1 THEN
    RAISE EXCEPTION 'DB06 quiz lifecycle mutation requires next version'
      USING ERRCODE='23514';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.results_published IS DISTINCT FROM OLD.results_published THEN
      RAISE EXCEPTION 'DB06 status transition cannot change result visibility'
        USING ERRCODE='23514';
    END IF;

    IF OLD.status::text = 'DRAFT'
       AND NEW.status::text = 'PUBLISHED' THEN
      IF NEW.due_at IS NOT NULL AND NEW.due_at <= now() THEN
        RAISE EXCEPTION 'DB06 cannot publish quiz after due time'
          USING ERRCODE='23514';
      END IF;
      SELECT EXISTS (
        SELECT 1 FROM quiz_questions qq WHERE qq.quiz_id = NEW.id
      ) INTO has_questions;
      IF NOT has_questions OR NEW.total_points <= 0 THEN
        RAISE EXCEPTION 'DB06 cannot publish quiz without scored questions'
          USING ERRCODE='23514';
      END IF;
      RETURN NEW;
    END IF;

    IF OLD.status::text = 'PUBLISHED'
       AND NEW.status::text IN ('DRAFT','CLOSED','ARCHIVED') THEN
      RETURN NEW;
    END IF;

    IF OLD.status::text = 'DRAFT'
       AND NEW.status::text = 'ARCHIVED' THEN
      RETURN NEW;
    END IF;

    IF OLD.status::text = 'CLOSED'
       AND NEW.status::text = 'ARCHIVED' THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'DB06 invalid quiz lifecycle transition: % -> %',
      OLD.status::text, NEW.status::text
      USING ERRCODE='23514';
  END IF;

  -- Result visibility mutation with stable status.
  IF OLD.results_published = false
     AND NEW.results_published = true
     AND NEW.status::text = 'CLOSED' THEN
    RETURN NEW;
  END IF;

  IF OLD.results_published = true
     AND NEW.results_published = false
     AND NEW.status::text IN ('CLOSED','ARCHIVED') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'DB06 invalid quiz result-publication transition'
    USING ERRCODE='23514';
END;
$db06_quiz_lifecycle$;

CREATE TRIGGER db06_course_quiz_lifecycle_guard
BEFORE INSERT OR UPDATE ON course_quizzes
FOR EACH ROW EXECUTE FUNCTION db06_guard_course_quiz_lifecycle();

-- Same-transaction immutable event completeness ----------------------------

CREATE FUNCTION db06_require_quiz_lifecycle_event()
RETURNS trigger LANGUAGE plpgsql AS $db06_require_quiz_event$
DECLARE
  expected_action text;
  quiz_college uuid;
BEGIN
  SELECT dep.college_id
    INTO quiz_college
    FROM course_lessons l
    JOIN course_learning_paths lp ON lp.id = l.learning_path_id
    JOIN course_offerings co ON co.id = lp.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN departments dep ON dep.id = c.department_id
    WHERE l.id = NEW.lesson_id;

  IF TG_OP = 'INSERT' THEN
    expected_action := 'CREATE';
    IF NOT EXISTS (
      SELECT 1
      FROM course_quiz_lifecycle_events e
      WHERE e.quiz_id = NEW.id
        AND e.college_id = quiz_college
        AND e.delivery_id IS NOT DISTINCT FROM NEW.delivery_id
        AND e.action = 'CREATE'
        AND e.previous_status IS NULL
        AND e.new_status = NEW.status::text
        AND e.previous_results_published IS NULL
        AND e.new_results_published = NEW.results_published
        AND e.lifecycle_version_before IS NULL
        AND e.lifecycle_version_after = NEW.lifecycle_version
    ) THEN
      RAISE EXCEPTION 'DB06 quiz creation missing immutable lifecycle event'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.results_published IS NOT DISTINCT FROM OLD.results_published THEN
    RETURN NEW;
  END IF;

  expected_action := CASE
    WHEN NEW.status IS DISTINCT FROM OLD.status
      AND OLD.status::text = 'DRAFT'
      AND NEW.status::text = 'PUBLISHED'
      THEN 'PUBLISH'
    WHEN NEW.status IS DISTINCT FROM OLD.status
      AND OLD.status::text = 'PUBLISHED'
      AND NEW.status::text = 'DRAFT'
      THEN 'UNPUBLISH'
    WHEN NEW.status IS DISTINCT FROM OLD.status
      AND OLD.status::text = 'PUBLISHED'
      AND NEW.status::text = 'CLOSED'
      THEN 'CLOSE'
    WHEN NEW.status IS DISTINCT FROM OLD.status
      AND NEW.status::text = 'ARCHIVED'
      THEN 'ARCHIVE'
    WHEN NEW.results_published = true
      THEN 'RESULTS_PUBLISH'
    ELSE 'RESULTS_UNPUBLISH'
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM course_quiz_lifecycle_events e
    WHERE e.quiz_id = NEW.id
      AND e.college_id = quiz_college
      AND e.delivery_id IS NOT DISTINCT FROM NEW.delivery_id
      AND e.action = expected_action
      AND e.previous_status = OLD.status::text
      AND e.new_status = NEW.status::text
      AND e.previous_results_published = OLD.results_published
      AND e.new_results_published = NEW.results_published
      AND e.lifecycle_version_before = OLD.lifecycle_version
      AND e.lifecycle_version_after = NEW.lifecycle_version
  ) THEN
    RAISE EXCEPTION 'DB06 quiz lifecycle mutation missing immutable event'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_require_quiz_event$;

CREATE CONSTRAINT TRIGGER db06_quiz_lifecycle_event_required
AFTER INSERT OR UPDATE ON course_quizzes
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION db06_require_quiz_lifecycle_event();

-- Every event must describe the final persisted row version/state. This allows
-- producer code to write row/event in either order but disallows orphan/future
-- events and deliberately permits at most one lifecycle mutation per quiz in a
-- transaction.
CREATE FUNCTION db06_validate_quiz_lifecycle_event_target()
RETURNS trigger LANGUAGE plpgsql AS $db06_validate_quiz_event$
BEGIN
  PERFORM 1
    FROM course_quizzes q
    WHERE q.id = NEW.quiz_id
      AND q.lifecycle_version = NEW.lifecycle_version_after
      AND q.status::text = NEW.new_status
      AND q.results_published = NEW.new_results_published
      AND q.delivery_id IS NOT DISTINCT FROM NEW.delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB06 quiz lifecycle event does not match final quiz state'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_validate_quiz_event$;

CREATE CONSTRAINT TRIGGER db06_quiz_lifecycle_event_target
AFTER INSERT ON course_quiz_lifecycle_events
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION db06_validate_quiz_lifecycle_event_target();

-- Append-only / retained history -------------------------------------------

CREATE FUNCTION db06_reject_quiz_lifecycle_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $db06_quiz_event_immutable$
BEGIN
  RAISE EXCEPTION 'DB06 quiz lifecycle history is append-only'
    USING ERRCODE='23514';
END;
$db06_quiz_event_immutable$;

CREATE TRIGGER db06_quiz_lifecycle_events_no_update_delete
BEFORE UPDATE OR DELETE ON course_quiz_lifecycle_events
FOR EACH ROW EXECUTE FUNCTION db06_reject_quiz_lifecycle_history_mutation();

CREATE TRIGGER db06_quiz_lifecycle_events_no_truncate
BEFORE TRUNCATE ON course_quiz_lifecycle_events
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_quiz_lifecycle_history_mutation();

CREATE TRIGGER db06_course_quizzes_no_delete
BEFORE DELETE ON course_quizzes
FOR EACH ROW EXECUTE FUNCTION db06_reject_quiz_lifecycle_history_mutation();

CREATE TRIGGER db06_course_quizzes_no_truncate
BEFORE TRUNCATE ON course_quizzes
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_quiz_lifecycle_history_mutation();

-- Producer cutover requirements:
-- 1. createCourseQuiz inserts CREATE event with version 0 in the same tx.
-- 2. transitionCourseQuiz locks current row, writes exactly one state transition
--    and event, incrementing lifecycle_version once.
-- 3. Add UNPUBLISH to the API transition enum to preserve active legacy parity.
-- 4. setCourseQuizResults writes RESULTS_PUBLISH/RESULTS_UNPUBLISH event using
--    live RequestContext actor and increments lifecycle_version once.
-- 5. Actor role snapshot is SUPER_ADMIN, COLLEGE_ADMIN or delivery-assigned
--    FACULTY, matching the current coarse authorization path.
-- 6. Do not infer historical actors for existing rows; BASELINE is actorless.

-- PostgreSQL acceptance before registration:
-- A BASELINE backfill covers every pre-existing quiz exactly once.
-- B CREATE without event fails at COMMIT; valid CREATE+event commits.
-- C DRAFT->PUBLISHED requires future due time and scored questions.
-- D PUBLISHED->DRAFT (UNPUBLISH), PUBLISHED->CLOSED and any active->ARCHIVED
--   allowed transition commits only with matching event.
-- E illegal DRAFT->CLOSED, CLOSED->PUBLISHED, ARCHIVED->* transitions fail.
-- F status + results change in one UPDATE fails.
-- G RESULTS_PUBLISH allowed only CLOSED false->true with event.
-- H RESULTS_UNPUBLISH allowed CLOSED/ARCHIVED true->false with event.
-- I lifecycle version skip/reuse and metadata-only version mutation fail.
-- J generic quiz FACULTY event fails; COLLEGE_ADMIN succeeds.
-- K delivery quiz assigned FACULTY succeeds; unassigned/cross-college fails.
-- L persisted SUPER_ADMIN succeeds without membership; forged role fails.
-- M event tenant/delivery/creator mismatch fails.
-- N event UPDATE/DELETE/TRUNCATE and quiz DELETE/TRUNCATE fail.
-- O concurrent lifecycle mutations serialize; stale second transition fails.
-- P event inserted without matching final row state fails at COMMIT.
