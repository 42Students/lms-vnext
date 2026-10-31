-- DB045 forward-only atomic attendance history cutover.
-- Registered 0205 grade ledger and 0320..0322 grade guards remain untouched.
-- Never fabricate history for pre-existing unaudited records.
DO $db045_attendance_preflight$
BEGIN
  IF EXISTS(SELECT 1 FROM attendance_records LIMIT 1) THEN
    RAISE EXCEPTION 'DB045 attendance history requires audited existing-data backfill'
      USING ERRCODE='23514';
  END IF;
END;
$db045_attendance_preflight$;

ALTER TABLE attendance_records
  ADD COLUMN version integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT attendance_records_version_ck CHECK (version >= 0);

CREATE UNIQUE INDEX attendance_records_event_identity_uq
  ON attendance_records(id, schedule_event_id, membership_id);

CREATE UNIQUE INDEX section_schedule_event_courses_event_delivery_uq
  ON section_schedule_event_courses(schedule_event_id, delivery_id);

CREATE TABLE attendance_record_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid NOT NULL,
  schedule_event_id uuid NOT NULL
    REFERENCES section_schedule_events(id) ON DELETE RESTRICT,
  delivery_id uuid NOT NULL
    REFERENCES course_section_deliveries(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_membership_id uuid
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  actor_role varchar(24) NOT NULL,
  action varchar(24) NOT NULL,
  previous_status varchar(24),
  new_status varchar(24) NOT NULL,
  previous_note text,
  new_note text,
  previous_marked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  new_marked_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  previous_marked_at timestamptz,
  new_marked_at timestamptz NOT NULL,
  record_version_before integer,
  record_version_after integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_record_events_record_identity_fk
    FOREIGN KEY (attendance_record_id, schedule_event_id, membership_id)
    REFERENCES attendance_records(id, schedule_event_id, membership_id)
      ON DELETE RESTRICT,
  CONSTRAINT attendance_record_events_delivery_identity_fk
    FOREIGN KEY (schedule_event_id, delivery_id)
    REFERENCES section_schedule_event_courses(schedule_event_id, delivery_id)
      ON DELETE RESTRICT,
  CONSTRAINT attendance_record_events_actor_role_ck
    CHECK (actor_role IN ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY')),
  CONSTRAINT attendance_record_events_actor_shape_ck
    CHECK ((actor_role = 'SUPER_ADMIN' AND actor_membership_id IS NULL)
       OR (actor_role IN ('COLLEGE_ADMIN','FACULTY') AND actor_membership_id IS NOT NULL)),
  CONSTRAINT attendance_record_events_action_ck
    CHECK (action IN ('MARK','CORRECT')),
  CONSTRAINT attendance_record_events_status_ck
    CHECK (
      new_status IN ('PRESENT','ABSENT','EXCUSED','MEDICAL','LATE')
      AND (
        previous_status IS NULL
        OR previous_status IN ('PRESENT','ABSENT','EXCUSED','MEDICAL','LATE')
      )
    ),
  CONSTRAINT attendance_record_events_version_ck
    CHECK (
      (record_version_before IS NULL AND record_version_after = 0)
      OR (
        record_version_before >= 0
        AND record_version_after = record_version_before + 1
      )
    ),
  CONSTRAINT attendance_record_events_shape_ck
    CHECK ((
      (
        action = 'MARK'
        AND previous_status IS NULL
        AND previous_note IS NULL
        AND previous_marked_by_user_id IS NULL
        AND previous_marked_at IS NULL
        AND record_version_before IS NULL
        AND record_version_after = 0
      )
      OR
      (
        action = 'CORRECT'
        AND previous_status IS NOT NULL
        AND previous_marked_by_user_id IS NOT NULL
        AND previous_marked_at IS NOT NULL
        AND record_version_before IS NOT NULL
        AND record_version_after = record_version_before + 1
      )
    )
    AND new_marked_by_user_id IS NOT NULL
    AND new_marked_at IS NOT NULL
));
CREATE UNIQUE INDEX attendance_record_events_record_version_uq
  ON attendance_record_events(attendance_record_id, record_version_after);
CREATE INDEX attendance_record_events_record_time_idx
  ON attendance_record_events(attendance_record_id, occurred_at);
CREATE INDEX attendance_record_events_member_time_idx
  ON attendance_record_events(membership_id, occurred_at);
CREATE INDEX attendance_record_events_session_time_idx
  ON attendance_record_events(schedule_event_id, occurred_at);
CREATE INDEX attendance_record_events_college_time_idx
  ON attendance_record_events(college_id, occurred_at);
CREATE INDEX attendance_record_events_actor_time_idx
  ON attendance_record_events(actor_user_id, occurred_at);

CREATE FUNCTION db06_attendance_event_scope_guard()
RETURNS trigger LANGUAGE plpgsql AS $db06_attendance_scope$
DECLARE
  event_section uuid;
  event_college uuid;
  linked_delivery uuid;
  learner_college uuid;
  actor_college uuid;
  actor_user uuid;
  current_status text;
  current_note text;
  current_marked_by uuid;
  current_marked_at timestamptz;
  current_version integer;
BEGIN
  SELECT e.section_id, dep.college_id
    INTO event_section, event_college
    FROM section_schedule_events e
    JOIN sections sec ON sec.id = e.section_id
    JOIN cohorts c ON c.id = sec.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments dep ON dep.id = p.department_id
    WHERE e.id = NEW.schedule_event_id
    FOR SHARE OF e, sec, c, p, dep;

  IF event_section IS NULL OR event_college IS NULL THEN
    RAISE EXCEPTION 'DB06 attendance event schedule scope is missing'
      USING ERRCODE='23503';
  END IF;

  SELECT ec.delivery_id
    INTO linked_delivery
    FROM section_schedule_event_courses ec
    WHERE ec.schedule_event_id = NEW.schedule_event_id
    FOR SHARE;

  IF linked_delivery IS NULL THEN
    RAISE EXCEPTION 'DB06 attendance event requires a course-linked schedule'
      USING ERRCODE='23514';
  END IF;

  IF NEW.delivery_id IS DISTINCT FROM linked_delivery THEN
    RAISE EXCEPTION 'DB06 attendance event delivery does not match schedule link'
      USING ERRCODE='23514';
  END IF;

  IF linked_delivery IS NOT NULL THEN
    PERFORM 1
      FROM course_section_deliveries d
      WHERE d.id = linked_delivery
        AND d.section_id = event_section
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 attendance event delivery belongs to another section'
        USING ERRCODE='23514';
    END IF;
  END IF;

  SELECT college_id
    INTO learner_college
    FROM college_memberships
    WHERE id = NEW.membership_id
    FOR SHARE;

  IF learner_college IS DISTINCT FROM event_college
     OR NEW.college_id IS DISTINCT FROM event_college THEN
    RAISE EXCEPTION 'DB06 attendance event schedule/learner tenant mismatch'
      USING ERRCODE='23514';
  END IF;

  IF NEW.actor_user_id IS DISTINCT FROM NEW.new_marked_by_user_id THEN
    RAISE EXCEPTION 'DB06 attendance event actor must equal current marker'
      USING ERRCODE='23514';
  END IF;

  IF NEW.actor_membership_id IS NOT NULL THEN
    SELECT college_id, user_id
      INTO actor_college, actor_user
      FROM college_memberships
      WHERE id = NEW.actor_membership_id
        AND status = 'ACTIVE'
      FOR SHARE;

    IF actor_college IS DISTINCT FROM event_college
       OR actor_user IS DISTINCT FROM NEW.actor_user_id THEN
      RAISE EXCEPTION 'DB06 attendance event actor membership mismatch'
        USING ERRCODE='23514';
    END IF;

    IF NEW.actor_role = 'COLLEGE_ADMIN' THEN
      PERFORM 1
        FROM membership_roles mr
        WHERE mr.membership_id = NEW.actor_membership_id
          AND mr.role = 'COLLEGE_ADMIN'
        FOR SHARE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'DB06 attendance actor lacks COLLEGE_ADMIN grant'
          USING ERRCODE='23514';
      END IF;
    ELSIF NEW.actor_role = 'FACULTY' THEN
      IF linked_delivery IS NOT NULL THEN
        PERFORM 1
          FROM membership_roles mr
          JOIN course_teaching_assignments cta
            ON cta.membership_id = mr.membership_id
           AND cta.delivery_id = linked_delivery
           AND cta.ended_at IS NULL
          WHERE mr.membership_id = NEW.actor_membership_id
            AND mr.role = 'FACULTY'
          FOR SHARE OF mr, cta;
      ELSE
        PERFORM 1
          FROM membership_roles mr
          JOIN section_faculty_assignments sfa
            ON sfa.membership_id = mr.membership_id
           AND sfa.section_id = event_section
           AND sfa.ended_at IS NULL
          WHERE mr.membership_id = NEW.actor_membership_id
            AND mr.role = 'FACULTY'
          FOR SHARE OF mr, sfa;
      END IF;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'DB06 attendance actor lacks teaching scope'
          USING ERRCODE='23514';
      END IF;
    ELSE
      RAISE EXCEPTION 'DB06 attendance tenant actor role invalid'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.actor_role <> 'SUPER_ADMIN' THEN
      RAISE EXCEPTION 'DB06 attendance actor without membership must be SUPER_ADMIN'
        USING ERRCODE='23514';
    END IF;

    PERFORM 1
      FROM system_roles
      WHERE user_id = NEW.actor_user_id
        AND role = 'SUPER_ADMIN'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'DB06 attendance SUPER_ADMIN role is missing'
        USING ERRCODE='23514';
    END IF;
  END IF;

  SELECT ar.status, ar.note, ar.marked_by_user_id, ar.marked_at, ar.version
    INTO current_status, current_note, current_marked_by, current_marked_at,
         current_version
    FROM attendance_records ar
    WHERE ar.id = NEW.attendance_record_id
      AND ar.schedule_event_id = NEW.schedule_event_id
      AND ar.membership_id = NEW.membership_id
    FOR SHARE;

  IF current_status IS NULL
     OR NEW.new_status IS DISTINCT FROM current_status
     OR NEW.new_note IS DISTINCT FROM current_note
     OR NEW.new_marked_by_user_id IS DISTINCT FROM current_marked_by
     OR NEW.new_marked_at IS DISTINCT FROM current_marked_at
     OR NEW.record_version_after IS DISTINCT FROM current_version THEN
    RAISE EXCEPTION 'DB06 attendance event does not match current row post-state'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$db06_attendance_scope$;
CREATE TRIGGER db06_attendance_event_scope_guard
BEFORE INSERT ON attendance_record_events
FOR EACH ROW EXECUTE FUNCTION db06_attendance_event_scope_guard();

CREATE TRIGGER db06_attendance_events_no_mutation
BEFORE UPDATE OR DELETE ON attendance_record_events
FOR EACH ROW EXECUTE FUNCTION db06_reject_history_mutation();
CREATE TRIGGER db06_grade_events_no_truncate
BEFORE TRUNCATE ON assignment_grade_events
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_history_mutation();
CREATE TRIGGER db06_attendance_events_no_truncate
BEFORE TRUNCATE ON attendance_record_events
FOR EACH STATEMENT EXECUTE FUNCTION db06_reject_history_mutation();

CREATE FUNCTION db06_attendance_record_version_guard()
RETURNS trigger LANGUAGE plpgsql AS $db06_attendance_version$
BEGIN
  IF NEW.schedule_event_id IS DISTINCT FROM OLD.schedule_event_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id THEN
    RAISE EXCEPTION 'DB06 attendance record identity is immutable'
      USING ERRCODE='23514';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.note IS DISTINCT FROM OLD.note
     OR NEW.marked_by_user_id IS DISTINCT FROM OLD.marked_by_user_id
     OR NEW.marked_at IS DISTINCT FROM OLD.marked_at THEN
    IF NEW.version <> OLD.version + 1 THEN
      RAISE EXCEPTION 'DB06 attendance correction requires next version'
        USING ERRCODE='23514';
    END IF;
  ELSIF NEW.version IS DISTINCT FROM OLD.version THEN
    RAISE EXCEPTION 'DB06 attendance version cannot change without correction'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_attendance_version$;
CREATE TRIGGER db06_attendance_record_version_guard
BEFORE UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION db06_attendance_record_version_guard();

CREATE FUNCTION db06_require_attendance_event()
RETURNS trigger LANGUAGE plpgsql AS $db06_require_attendance$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.version <> 0 THEN
      RAISE EXCEPTION 'DB06 initial attendance record version must be zero'
        USING ERRCODE='23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM attendance_record_events e
      WHERE e.attendance_record_id = NEW.id
        AND e.schedule_event_id = NEW.schedule_event_id
        AND e.membership_id = NEW.membership_id
        AND e.action = 'MARK'
        AND e.previous_status IS NULL
        AND e.new_status = NEW.status
        AND e.previous_note IS NULL
        AND e.new_note IS NOT DISTINCT FROM NEW.note
        AND e.previous_marked_by_user_id IS NULL
        AND e.new_marked_by_user_id = NEW.marked_by_user_id
        AND e.previous_marked_at IS NULL
        AND e.new_marked_at = NEW.marked_at
        AND e.actor_user_id = NEW.marked_by_user_id
        AND e.record_version_before IS NULL
        AND e.record_version_after = NEW.version
    ) THEN
      RAISE EXCEPTION 'DB06 attendance mark missing immutable audit event'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.note IS NOT DISTINCT FROM OLD.note
     AND NEW.marked_by_user_id IS NOT DISTINCT FROM OLD.marked_by_user_id
     AND NEW.marked_at IS NOT DISTINCT FROM OLD.marked_at THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM attendance_record_events e
    WHERE e.attendance_record_id = NEW.id
      AND e.schedule_event_id = NEW.schedule_event_id
      AND e.membership_id = NEW.membership_id
      AND e.action = 'CORRECT'
      AND e.previous_status = OLD.status
      AND e.new_status = NEW.status
      AND e.previous_note IS NOT DISTINCT FROM OLD.note
      AND e.new_note IS NOT DISTINCT FROM NEW.note
      AND e.previous_marked_by_user_id = OLD.marked_by_user_id
      AND e.new_marked_by_user_id = NEW.marked_by_user_id
      AND e.previous_marked_at = OLD.marked_at
      AND e.new_marked_at = NEW.marked_at
      AND e.actor_user_id = NEW.marked_by_user_id
      AND e.record_version_before = OLD.version
      AND e.record_version_after = NEW.version
  ) THEN
    RAISE EXCEPTION 'DB06 attendance correction missing immutable audit event'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db06_require_attendance$;

CREATE CONSTRAINT TRIGGER db06_attendance_event_required
AFTER INSERT OR UPDATE ON attendance_records
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION db06_require_attendance_event();

