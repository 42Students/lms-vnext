-- DB02 UNREGISTERED history-parent integrity draft (Chat 4, DB-005).
-- Apply only after the canonical DB02 stage and its tenancy extension.
-- Chat 1 owns numbered migration registration and PostgreSQL acceptance.
-- Never infer a runtime PASS from this SQL source.

-- The existing checks run when links are inserted/updated, but a later UPDATE
-- of a parent offering, delivery, or schedule event can invalidate its children.
-- Each historic parent is immutable after the first dependent historic row.

CREATE FUNCTION db02_guard_historic_offering_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.cohort_id, NEW.academic_period_id, NEW.course_id, NEW.program_term_id)
     IS DISTINCT FROM
     (OLD.cohort_id, OLD.academic_period_id, OLD.course_id, OLD.program_term_id)
     AND EXISTS (
       SELECT 1 FROM course_section_deliveries d WHERE d.offering_id = OLD.id
     ) THEN
    RAISE EXCEPTION 'Offering academic identity cannot change after delivery exists'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_historic_offering_parent_guard
BEFORE UPDATE OF cohort_id, academic_period_id, course_id, program_term_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_offering_parent();

CREATE FUNCTION db02_guard_historic_delivery_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.offering_id, NEW.section_id)
     IS DISTINCT FROM (OLD.offering_id, OLD.section_id)
     AND (
       EXISTS (SELECT 1 FROM course_teaching_assignments t WHERE t.delivery_id = OLD.id)
       OR EXISTS (SELECT 1 FROM section_schedule_event_courses ec WHERE ec.delivery_id = OLD.id)
     ) THEN
    RAISE EXCEPTION 'Course delivery identity cannot change after teaching or event history'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_historic_delivery_parent_guard
BEFORE UPDATE OF offering_id, section_id
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_delivery_parent();

CREATE FUNCTION db02_guard_historic_event_section()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.section_id IS DISTINCT FROM OLD.section_id AND (
      EXISTS (SELECT 1 FROM section_schedule_event_courses ec WHERE ec.schedule_event_id = OLD.id)
      OR EXISTS (SELECT 1 FROM attendance_sessions a WHERE a.schedule_event_id = OLD.id)
      OR EXISTS (SELECT 1 FROM attendance_records a WHERE a.schedule_event_id = OLD.id)
    ) THEN
    RAISE EXCEPTION 'Schedule event cannot move section after delivery/attendance history'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_historic_event_section_guard
BEFORE UPDATE OF section_id ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_event_section();

-- FK KEY SHARE row locks do not conflict with a non-key parent UPDATE,
-- which uses NO KEY UPDATE. Explicit SHARE locks serialize parent reparenting
-- against history insertion. The parent guard then sees committed children
-- or the child's validation runs against the committed parent.
CREATE FUNCTION db02_lock_offering_for_delivery()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM course_offerings WHERE id = NEW.offering_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown historic course offering' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_delivery_parent_serialization
BEFORE INSERT OR UPDATE OF offering_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_lock_offering_for_delivery();

CREATE FUNCTION db02_lock_delivery_for_teaching()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM course_section_deliveries WHERE id = NEW.delivery_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown delivery for teaching history' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_teaching_delivery_serialization
BEFORE INSERT OR UPDATE OF delivery_id ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_lock_delivery_for_teaching();

CREATE FUNCTION db02_lock_event_delivery_for_course_link()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Lock rows in fixed order to reduce multi-resource deadlock exposure.
  PERFORM 1 FROM course_section_deliveries WHERE id = NEW.delivery_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown delivery for scheduled course' USING ERRCODE='23503';
  END IF;
  PERFORM 1 FROM section_schedule_events WHERE id = NEW.schedule_event_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown schedule event for course link' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_event_course_parent_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id, delivery_id ON section_schedule_event_courses
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_delivery_for_course_link();

CREATE FUNCTION db02_lock_event_for_attendance_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM section_schedule_events WHERE id = NEW.schedule_event_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown schedule event for attendance history' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_attendance_session_event_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id ON attendance_sessions
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_for_attendance_history();

CREATE TRIGGER db02_attendance_record_event_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id ON attendance_records
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_for_attendance_history();

-- Acceptance needed before Chat 1 integration:
-- 1) Reparent an unlinked offering and empty delivery when otherwise valid: permitted.
-- 2) Once a course_section_delivery exists, changing offering course/cohort/term/period: rejected.
-- 3) Once a course teaching assignment or event-course link exists, switching
--    delivery offering/section: rejected.
-- 4) Once attendance_sessions OR attendance_records OR event-course link exists,
--    switching the linked schedule event section: rejected, even within the college.
-- 5) Two concurrent sessions: reparent offering versus attach delivery, and
--    reparent schedule event versus insert attendance; at most one valid winner.
-- 6) Historical read consistency across tenant, section, curriculum and attendance.
-- 7) Lock/deadlock behavior and runtime role permissions accepted on disposable PG.
-- All statements and witnesses UNREGISTERED/UNEXECUTED.
