-- Chat 6 / DB-008: COURSE -> OFFERING -> DELIVERY -> FACULTY
-- UNREGISTERED READ-COMMITTED LIFECYCLE RACE COMPANION.
-- DO NOT DEPLOY OR REGISTER WITHOUT INTEGRATION TESTS AND W01 APPROVAL.
-- Legacy-source behavior is NOT claimed: these are EXISTING vNext service
-- invariants that can race because an application SELECT precedes UPDATE.
-- Authoritative runtime source:
-- course-service.archiveCourse rejects active offerings
-- offering-service.archiveCourseOffering rejects active deliveries
-- delivery-service.endCourseSectionDelivery rejects active teachers.
--
-- Purpose: require active children to have active parents; prevent archiving
-- parent with active children; pair child FOR SHARE row locks against parent
-- status UPDATE row locks (FOR NO KEY UPDATE) under READ COMMITTED.
-- This adds NO new tables/columns, and MUST merge only once after existing
-- db05-offering-delivery-scope.draft.sql to avoid redundant trigger/function
-- definitions. Dedicated trigger names below must be unique in journal.
-- 
-- IMPORTANT: READ COMMITTED, FK/link, tenant and status ancestry still need
-- PostgreSQL two-session verification. No claim of race-proof until tested.
BEGIN;

CREATE OR REPLACE FUNCTION db05_lifecycle_course_must_have_no_active_offerings()
RETURNS trigger LANGUAGE plpgsql AS $db05_parent_course$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED'
     AND EXISTS (
       SELECT 1 FROM course_offerings offering
        WHERE offering.course_id = OLD.id
          AND offering.status = 'ACTIVE'
     ) THEN
    RAISE EXCEPTION 'cannot archive course with active offerings'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_parent_course$;

CREATE TRIGGER db05_course_archive_active_offerings_guard
BEFORE UPDATE OF status ON courses
FOR EACH ROW EXECUTE FUNCTION db05_lifecycle_course_must_have_no_active_offerings();

CREATE OR REPLACE FUNCTION db05_lifecycle_offering_active_course_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_child_course$
DECLARE parent_status text;
BEGIN
  IF NEW.status = 'ACTIVE' THEN
    SELECT status::text INTO parent_status FROM courses
      WHERE id = NEW.course_id
      FOR SHARE;
    IF parent_status IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'active offering requires active course'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$db05_child_course$;

CREATE TRIGGER db05_offering_active_course_before_write
BEFORE INSERT OR UPDATE OF course_id, status ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db05_lifecycle_offering_active_course_guard();

CREATE OR REPLACE FUNCTION db05_lifecycle_offering_must_have_no_live_deliveries()
RETURNS trigger LANGUAGE plpgsql AS $db05_parent_offering$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED'
     AND EXISTS (
       SELECT 1 FROM course_section_deliveries delivery
        WHERE delivery.offering_id = OLD.id
          AND delivery.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'cannot archive offering with active delivery'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_parent_offering$;

CREATE TRIGGER db05_offering_archive_live_deliveries_guard
BEFORE UPDATE OF status ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db05_lifecycle_offering_must_have_no_live_deliveries();

CREATE OR REPLACE FUNCTION db05_lifecycle_delivery_active_offering_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_child_offering$
DECLARE parent_status text;
BEGIN
  IF NEW.ended_at IS NULL THEN
    SELECT status::text INTO parent_status FROM course_offerings
      WHERE id = NEW.offering_id
      FOR SHARE;
    IF parent_status IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'active delivery requires active offering'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$db05_child_offering$;

CREATE TRIGGER db05_delivery_active_offering_before_write
BEFORE INSERT OR UPDATE OF offering_id, ended_at ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db05_lifecycle_delivery_active_offering_guard();

CREATE OR REPLACE FUNCTION db05_lifecycle_delivery_must_have_no_active_teachers()
RETURNS trigger LANGUAGE plpgsql AS $db05_parent_delivery$
BEGIN
  IF OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM course_teaching_assignments teacher
        WHERE teacher.delivery_id = OLD.id
          AND teacher.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'cannot end delivery with active teaching assignments'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_parent_delivery$;

CREATE TRIGGER db05_delivery_end_active_teachers_guard
BEFORE UPDATE OF ended_at ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db05_lifecycle_delivery_must_have_no_active_teachers();

CREATE OR REPLACE FUNCTION db05_lifecycle_teacher_active_delivery_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_child_delivery$
DECLARE parent_ended_at timestamptz;
DECLARE found_parent boolean := false;
BEGIN
  IF NEW.ended_at IS NULL THEN
    SELECT d.ended_at, true INTO parent_ended_at, found_parent
      FROM course_section_deliveries d
      WHERE d.id = NEW.delivery_id
      FOR SHARE;
    IF NOT found_parent OR parent_ended_at IS NOT NULL THEN
      RAISE EXCEPTION 'active teaching assignment requires live delivery'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$db05_child_delivery$;

CREATE TRIGGER db05_teacher_active_delivery_before_write
BEFORE INSERT OR UPDATE OF delivery_id, ended_at ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db05_lifecycle_teacher_active_delivery_guard();

COMMIT;

-- TWO-CONNECTION PostgreSQL acceptance (NOT RUN):
-- HL-01 Active course archived with zero active offerings => allow.
-- HL-02 Active course archived with an active offering => reject 23514.
-- HL-03 Archived offering does NOT block course archive; history preserved.
-- HL-04 New/re-activated offering under archived course => reject 23514.
-- HL-05 Concurrent offering insert and course archive: one rejected;
--       commit must NEVER leave ACTIVE child of ARCHIVED parent.
-- HL-06 Offering archive with live delivery => reject 23514.
-- HL-07 Ended delivery does not block offering archive.
-- HL-08 New/re-activated delivery under archived offering => reject 23514.
-- HL-09 Concurrent live delivery insert vs offering archive => one rejects.
-- HL-10 End delivery with active teacher => reject 23514.
-- HL-11 Previously ended teacher does not block delivery end.
-- HL-12 Assign/reactivate teacher on ended delivery => reject 23514.
-- HL-13 Concurrent teacher INSERT vs delivery END => one rejects.
-- HL-14 Same status / same ended_at UPDATE permitted when parent active.
-- HL-15 Multi-row statement trigger rejection rolls back whole statement.
-- HL-16 Under READ COMMITTED both orderings commit without orphan lifecycle.
-- HL-17 Under SERIALIZABLE/REPEATABLE READ retest for phantom visibility;
--       if unproven reject these isolation levels for lifecycle mutations.
-- HL-18 Prove lock order against db05-offering-delivery-scope and course
--       tombstone/ancestor guards (no deadlock under normal concurrent edits).
-- HL-19 Verify archived course/offering not surfaced in unauthorized reads;
--       no tenant or permissions bypass through direct SQL.
-- HL-20 Migration replay and DROP/rollback witness with W01; no trigger
--       duplicate or function name collision on the same exact main SHA.
