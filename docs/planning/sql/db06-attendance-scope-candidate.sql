-- DB-042 / Chat 3 — attendance current-row tenant/roster/marker integrity.
-- SOURCE-ONLY STAGING. NOT A REGISTERED MIGRATION. NOT EXECUTED.
--
-- Frozen legacy oracle:
--   lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--     Attend / ClassSchedule / RosterSql / LearnerServiceImpl.attend
--     AttendanceBulkController / AdminAttendanceController
-- Current vNext source:
--   src/db/schema/attendance.ts
--   src/modules/courses/delivery-roster.ts
--   src/modules/attendance/faculty-service.ts
--   src/modules/attendance/admin-service.ts
--
-- DB-035 owns immutable attendance correction history/versioning. This file
-- deliberately protects the CURRENT attendance/session rows and their tenant,
-- roster, principal and timing invariants without redefining DB-035 event tables.

-- ---------------------------------------------------------------------------
-- 1. Event/course-delivery scope
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_attendance_event_context(p_schedule_event_id uuid)
RETURNS TABLE (
  college_id uuid,
  delivery_id uuid,
  section_id uuid,
  academic_period_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  event_status text
)
LANGUAGE sql STABLE AS $db06_att_ctx$
  SELECT
    section_dep.college_id,
    d.id,
    e.section_id,
    o.academic_period_id,
    e.starts_at,
    e.ends_at,
    e.status::text
  FROM section_schedule_events e
  JOIN section_schedule_event_courses ec
    ON ec.schedule_event_id = e.id
  JOIN course_section_deliveries d
    ON d.id = ec.delivery_id
   AND d.section_id = e.section_id
  JOIN course_offerings o
    ON o.id = d.offering_id
  JOIN courses course
    ON course.id = o.course_id
  JOIN departments course_dep
    ON course_dep.id = course.department_id
  JOIN sections sec
    ON sec.id = e.section_id
  JOIN cohorts cohort
    ON cohort.id = sec.cohort_id
  JOIN programs program
    ON program.id = cohort.program_id
  JOIN departments section_dep
    ON section_dep.id = program.department_id
  WHERE e.id = p_schedule_event_id
    AND course_dep.college_id = section_dep.college_id
$db06_att_ctx$;

-- The event→delivery bridge is security-bearing for attendance. Individual FKs
-- are not enough: direct SQL must not link a section event to another section's
-- delivery or to a course owned by another college.
CREATE FUNCTION db06_attendance_event_delivery_scope_guard()
RETURNS trigger
LANGUAGE plpgsql AS $db06_event_delivery$
DECLARE
  v_event_section uuid;
  v_event_college uuid;
  v_delivery_section uuid;
  v_course_college uuid;
BEGIN
  SELECT e.section_id, dep.college_id
    INTO v_event_section, v_event_college
    FROM section_schedule_events e
    JOIN sections sec ON sec.id = e.section_id
    JOIN cohorts cohort ON cohort.id = sec.cohort_id
    JOIN programs program ON program.id = cohort.program_id
    JOIN departments dep ON dep.id = program.department_id
   WHERE e.id = NEW.schedule_event_id
   FOR SHARE OF e, sec, cohort, program, dep;

  SELECT d.section_id, dep.college_id
    INTO v_delivery_section, v_course_college
    FROM course_section_deliveries d
    JOIN course_offerings o ON o.id = d.offering_id
    JOIN courses course ON course.id = o.course_id
    JOIN departments dep ON dep.id = course.department_id
   WHERE d.id = NEW.delivery_id
   FOR SHARE OF d, o, course, dep;

  IF v_event_section IS NULL
     OR v_delivery_section IS NULL
     OR v_delivery_section IS DISTINCT FROM v_event_section
     OR v_course_college IS DISTINCT FROM v_event_college THEN
    RAISE EXCEPTION 'DB06 attendance event/delivery tenant or section mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db06_event_delivery$;

CREATE TRIGGER db06_attendance_event_delivery_scope_guard
BEFORE INSERT OR UPDATE OF schedule_event_id, delivery_id
ON section_schedule_event_courses
FOR EACH ROW EXECUTE FUNCTION db06_attendance_event_delivery_scope_guard();

-- ---------------------------------------------------------------------------
-- 2. Exact delivery roster
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_attendance_membership_on_roster(
  p_schedule_event_id uuid,
  p_membership_id uuid
) RETURNS boolean
LANGUAGE plpgsql STABLE AS $db06_roster$
DECLARE
  ctx record;
  v_elective_group uuid;
BEGIN
  SELECT *
    INTO ctx
    FROM db06_attendance_event_context(p_schedule_event_id);

  IF ctx.delivery_id IS NULL THEN
    RETURN false;
  END IF;

  -- Baseline principal/tenant checks shared by section and elective rosters.
  IF NOT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles mr ON mr.membership_id = m.id
      JOIN users u ON u.id = m.user_id
     WHERE m.id = p_membership_id
       AND m.college_id = ctx.college_id
       AND m.status = 'ACTIVE'
       AND mr.role = 'LEARNER'
       AND u.platform_status = 'ACTIVE'
  ) THEN
    RETURN false;
  END IF;

  -- IMPORTANT: presence of any elective_offerings row makes this an elective
  -- delivery. If that offering/slot/group was archived, access is revoked;
  -- never fall back to the ordinary section roster and accidentally widen it.
  SELECT eo.group_id
    INTO v_elective_group
    FROM elective_offerings eo
   WHERE eo.backed_delivery_id = ctx.delivery_id
   LIMIT 1;

  IF v_elective_group IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
        FROM elective_offerings eo
        JOIN elective_slots es ON es.id = eo.slot_id
        JOIN lms_groups g ON g.id = eo.group_id
        JOIN lms_group_members gm
          ON gm.group_id = eo.group_id
       WHERE eo.backed_delivery_id = ctx.delivery_id
         AND eo.group_id = v_elective_group
         AND eo.status = 'ACTIVE'
         AND eo.deleted_at IS NULL
         AND es.college_id = ctx.college_id
         AND es.status = 'ACTIVE'
         AND es.deleted_at IS NULL
         AND g.college_id = ctx.college_id
         AND g.kind = 'ELECTIVE'
         AND g.status = 'ACTIVE'
         AND g.deleted_at IS NULL
         AND gm.membership_id = p_membership_id
         AND gm.member_type = 'LEARNER'
         AND gm.state = 'ACTIVE'
    );
  END IF;

  -- Ordinary delivery roster: active section enrollment for this delivery's
  -- exact section + academic period, backed by an active learner enrollment.
  RETURN EXISTS (
    SELECT 1
      FROM section_enrollments se
      JOIN learner_program_enrollments lpe
        ON lpe.id = se.learner_enrollment_id
     WHERE lpe.membership_id = p_membership_id
       AND lpe.status = 'ACTIVE'
       AND se.section_id = ctx.section_id
       AND se.academic_period_id = ctx.academic_period_id
       AND se.status = 'ACTIVE'
  );
END;
$db06_roster$;

-- ---------------------------------------------------------------------------
-- 3. Marker authorization
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_attendance_actor_kind(
  p_user_id uuid,
  p_schedule_event_id uuid
) RETURNS text
LANGUAGE plpgsql STABLE AS $db06_actor$
DECLARE
  ctx record;
BEGIN
  SELECT *
    INTO ctx
    FROM db06_attendance_event_context(p_schedule_event_id);

  IF ctx.delivery_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users u
     WHERE u.id = p_user_id
       AND u.platform_status = 'ACTIVE'
  ) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM system_roles sr
     WHERE sr.user_id = p_user_id
       AND sr.role = 'SUPER_ADMIN'
  ) THEN
    RETURN 'SUPER_ADMIN';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles mr ON mr.membership_id = m.id
     WHERE m.user_id = p_user_id
       AND m.college_id = ctx.college_id
       AND m.status = 'ACTIVE'
       AND mr.role = 'COLLEGE_ADMIN'
  ) THEN
    RETURN 'COLLEGE_ADMIN';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles mr ON mr.membership_id = m.id
      JOIN course_teaching_assignments cta
        ON cta.membership_id = m.id
       AND cta.delivery_id = ctx.delivery_id
       AND cta.ended_at IS NULL
     WHERE m.user_id = p_user_id
       AND m.college_id = ctx.college_id
       AND m.status = 'ACTIVE'
       AND mr.role = 'FACULTY'
  ) THEN
    RETURN 'FACULTY';
  END IF;

  RETURN NULL;
END;
$db06_actor$;

CREATE FUNCTION db06_attendance_assert_write_timing(
  p_user_id uuid,
  p_schedule_event_id uuid,
  p_marked_at timestamptz
) RETURNS void
LANGUAGE plpgsql AS $db06_timing$
DECLARE
  ctx record;
  v_actor_kind text;
  v_window integer;
BEGIN
  SELECT *
    INTO ctx
    FROM db06_attendance_event_context(p_schedule_event_id);

  IF ctx.delivery_id IS NULL OR ctx.event_status <> 'SCHEDULED' THEN
    RAISE EXCEPTION 'DB06 attendance requires a scheduled course-linked event'
      USING ERRCODE = '23514';
  END IF;

  v_actor_kind := db06_attendance_actor_kind(
    p_user_id,
    p_schedule_event_id
  );
  IF v_actor_kind IS NULL THEN
    RAISE EXCEPTION 'DB06 attendance marker lacks authorized event scope'
      USING ERRCODE = '23514';
  END IF;

  -- Frozen legacy behavior: nobody, including admins, may mark a class that
  -- has not started. Admins bypass only the post-class correction window.
  IF clock_timestamp() < ctx.starts_at
     OR p_marked_at < ctx.starts_at THEN
    RAISE EXCEPTION 'DB06 attendance cannot be marked before session start'
      USING ERRCODE = '23514';
  END IF;

  -- marker timestamps are server-generated in the source contract; prevent
  -- direct SQL from fabricating a materially future mark.
  IF p_marked_at > clock_timestamp() + interval '5 minutes' THEN
    RAISE EXCEPTION 'DB06 attendance marked_at is implausibly in the future'
      USING ERRCODE = '23514';
  END IF;

  -- Faculty retain the legacy correction-window limit. College/super admins
  -- are correction authorities and intentionally bypass only this cutoff.
  IF v_actor_kind = 'FACULTY' THEN
    SELECT correction_window_hours
      INTO v_window
      FROM attendance_policies
     WHERE college_id = ctx.college_id;
    v_window := COALESCE(v_window, 24);

    IF clock_timestamp() > ctx.ends_at + make_interval(hours => v_window) THEN
      RAISE EXCEPTION 'DB06 faculty attendance correction window has closed'
        USING ERRCODE = '23514';
    END IF;
  END IF;
END;
$db06_timing$;

-- ---------------------------------------------------------------------------
-- 4. Current attendance rows
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_attendance_record_scope_guard()
RETURNS trigger
LANGUAGE plpgsql AS $db06_record_scope$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.schedule_event_id IS DISTINCT FROM OLD.schedule_event_id
    OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
  ) THEN
    RAISE EXCEPTION 'DB06 attendance record identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  IF NOT db06_attendance_membership_on_roster(
    NEW.schedule_event_id,
    NEW.membership_id
  ) THEN
    RAISE EXCEPTION 'DB06 attendance learner is outside the event roster'
      USING ERRCODE = '23514';
  END IF;

  PERFORM db06_attendance_assert_write_timing(
    NEW.marked_by_user_id,
    NEW.schedule_event_id,
    NEW.marked_at
  );

  IF NEW.updated_at < NEW.marked_at THEN
    RAISE EXCEPTION 'DB06 attendance updated_at cannot precede marked_at'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db06_record_scope$;

CREATE TRIGGER db06_attendance_record_scope_guard
BEFORE INSERT OR UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION db06_attendance_record_scope_guard();

-- Once DB-035 immutable history is composed, deleting a current row would
-- either destroy identity/history or fail its RESTRICT event FK. Normalize a
-- correction-to-present as status='PRESENT' + CORRECT event instead.
CREATE FUNCTION db06_reject_attendance_record_delete()
RETURNS trigger
LANGUAGE plpgsql AS $db06_record_delete$
BEGIN
  RAISE EXCEPTION 'DB06 attendance current row is retained; correct status to PRESENT instead of DELETE'
    USING ERRCODE = '23514';
END;
$db06_record_delete$;

CREATE TRIGGER db06_attendance_record_no_delete
BEFORE DELETE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION db06_reject_attendance_record_delete();

-- Faculty marking is whole-roster and must set the MARKED session in the
-- same transaction. A College/Super Admin can instead correct one learner in
-- an otherwise UNMARKED session; that explicit record must not silently mark
-- every other learner present. Restrict this exception to authorized admins.
CREATE FUNCTION db06_attendance_record_requires_marked_session()
RETURNS trigger
LANGUAGE plpgsql AS $db06_record_session$
DECLARE
  v_actor_kind text;
BEGIN
  IF EXISTS (
    SELECT 1
      FROM attendance_sessions s
     WHERE s.schedule_event_id = NEW.schedule_event_id
       AND s.status = 'MARKED'
       AND s.marked_at IS NOT NULL
       AND s.marked_by_user_id IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;

  v_actor_kind := db06_attendance_actor_kind(
    NEW.marked_by_user_id,
    NEW.schedule_event_id
  );
  IF v_actor_kind NOT IN ('COLLEGE_ADMIN', 'SUPER_ADMIN')
     OR v_actor_kind IS NULL THEN
    RAISE EXCEPTION 'DB06 faculty attendance record requires a marked session'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db06_record_session$;

CREATE CONSTRAINT TRIGGER db06_attendance_record_requires_marked_session
AFTER INSERT OR UPDATE ON attendance_records
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION db06_attendance_record_requires_marked_session();

-- ---------------------------------------------------------------------------
-- 5. Session mark lifecycle
-- ---------------------------------------------------------------------------

CREATE FUNCTION db06_attendance_session_scope_guard()
RETURNS trigger
LANGUAGE plpgsql AS $db06_session_scope$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.schedule_event_id IS DISTINCT FROM OLD.schedule_event_id THEN
    RAISE EXCEPTION 'DB06 attendance session event identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'MARKED'
     AND NEW.status <> 'MARKED' THEN
    RAISE EXCEPTION 'DB06 marked attendance session cannot become unmarked'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'MARKED' THEN
    PERFORM db06_attendance_assert_write_timing(
      NEW.marked_by_user_id,
      NEW.schedule_event_id,
      NEW.marked_at
    );

    IF TG_OP = 'UPDATE'
       AND OLD.marked_at IS NOT NULL
       AND NEW.marked_at < OLD.marked_at THEN
      RAISE EXCEPTION 'DB06 attendance session marked_at cannot move backwards'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db06_session_scope$;

CREATE TRIGGER db06_attendance_session_scope_guard
BEFORE INSERT OR UPDATE ON attendance_sessions
FOR EACH ROW EXECUTE FUNCTION db06_attendance_session_scope_guard();

CREATE FUNCTION db06_reject_marked_attendance_session_delete()
RETURNS trigger
LANGUAGE plpgsql AS $db06_session_delete$
BEGIN
  IF OLD.status = 'MARKED' THEN
    RAISE EXCEPTION 'DB06 marked attendance session cannot be deleted'
      USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$db06_session_delete$;

CREATE TRIGGER db06_attendance_session_no_delete
BEFORE DELETE ON attendance_sessions
FOR EACH ROW EXECUTE FUNCTION db06_reject_marked_attendance_session_delete();

-- ---------------------------------------------------------------------------
-- Integration notes
-- ---------------------------------------------------------------------------
-- * DB-035 separately stages attendance_records.version + immutable
--   attendance_record_events. W01 must compose both candidates once, not
--   duplicate current-row constraints.
-- * Existing vNext currently writes PRESENT by removing the exception row.
--   DB-035's immutable history FK already makes that incompatible with final
--   history. DB-042 therefore stages the explicit final cutover: retain the
--   current row and UPDATE status='PRESENT' with the DB-035 CORRECT event.
--   This candidate must not be registered before that narrow producer cutover.
-- * SUPER_ADMIN organization scoping is a higher-level identity policy; the
--   database has only system_roles here. API/runtime negative tests must prove
--   scoped-superadmin restrictions separately.
-- * No RLS/grants are invented by this source-only candidate.
--
-- PostgreSQL acceptance required before registration:
--  1. wrong-college event↔delivery link => 23514;
--  2. wrong-college learner => 23514;
--  3. ordinary learner not ACTIVE in exact section+academic period => 23514;
--  4. elective delivery member outside ACTIVE ELECTIVE group => 23514;
--  5. archived elective/slot/group cannot fall back to section roster;
--  6. unrelated faculty/TPO/mentor/learner marker => 23514;
--  7. assigned ACTIVE faculty succeeds; ended teaching assignment fails;
--  8. same-college COLLEGE_ADMIN succeeds; SUPER_ADMIN structural path succeeds;
--  9. any actor before starts_at => 23514;
-- 10. faculty after correction window => 23514; admin after window succeeds;
-- 11. MARKED session cannot return to UNMARKED or move marked_at backward;
-- 12. attendance row without final MARKED session fails at commit;
-- 13. duplicate event/member remains blocked by existing unique index;
-- 14. direct DELETE of an attendance current row is rejected; producer uses
--     status='PRESENT' + DB-035 CORRECT history instead;
-- 15. MARKED attendance session DELETE is rejected;
-- 16. DB-035 history/version triggers compose without duplicate names/order bugs;
-- 17. empty-database registered migration replay + rollback succeeds.
