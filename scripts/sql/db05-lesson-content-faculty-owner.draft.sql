-- DB-008 / Chat 6 / DATABASE phase. SOURCE-BACKED UNREGISTERED companion.
-- W01 ONLY may fold this into the registered DB05 lesson content migration.
-- NEVER execute this standalone on production. No PostgreSQL verification.
--
-- Legacy: LessonContents.facultyId (nullable owner, separate from author).
-- LessonContentsServiceImpl.createLessonContents() uses trusted faculty actor
-- for non-admin faculty and permits admin assignment to a faculty.
-- updateLessonContent/deleteLessonContent check owner == current faculty
-- (unless admin), then enforce active teaching scope. Generic null owner
-- does not grant unrestricted faculty editing.
-- vNext lesson_contents.created_by_user_id is provenance of author, NOT
-- evidence of the faculty owner; do not overwrite it on reassignment.
--
-- W01 prerequisites:
-- - lesson_contents, college_memberships, membership_roles, courses,
--   course_offerings, course_learning_paths, course_lessons, departments,
--   sections, academic_periods and delivery exist.
-- - consumer accepts optional faculty_owner_membership_id, validated against
--   authenticated actor + current teaching assignment / admin permission.
-- - upstream offering/path/department/period/membership reparent blocked or
--   revalidated; this row-write trigger alone does not guard parent updates.
-- - migration replay and wrong-tenant/role/concurrency tests actually run.
BEGIN;

ALTER TABLE lesson_contents
  ADD COLUMN faculty_owner_membership_id uuid
    REFERENCES college_memberships(id) ON DELETE RESTRICT;

CREATE INDEX db05_lesson_contents_faculty_owner_idx
  ON lesson_contents (faculty_owner_membership_id)
  WHERE faculty_owner_membership_id IS NOT NULL;

-- Owns no generic scope columns; this protects the nullable faculty
-- ownership candidate from cross-college and wrong-role direct SQL writes.
CREATE OR REPLACE FUNCTION db05_lesson_content_faculty_owner_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_faculty_owner$
DECLARE
  course_college_id uuid;
  period_college_id uuid;
  owner_college_id uuid;
  owner_status text;
  content_offering_id uuid;
  delivery_offering_id uuid;
  section_period_college_id uuid;
  newly_assigned boolean;
BEGIN
  -- Generic content has no assigned owner; other lesson/delivery scope guards
  -- remain responsible for validating its ancestry.
  IF NEW.faculty_owner_membership_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT department.college_id, period.college_id, offering.id,
         delivery.offering_id, section_period.college_id
    INTO course_college_id, period_college_id, content_offering_id,
         delivery_offering_id, section_period_college_id
  FROM course_lessons lesson
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments department ON department.id = course_row.department_id
  JOIN academic_periods period ON period.id = offering.academic_period_id
  LEFT JOIN course_section_deliveries delivery ON delivery.id = NEW.delivery_id
  LEFT JOIN sections section_row ON section_row.id = delivery.section_id
  LEFT JOIN academic_periods section_period
    ON section_period.id = section_row.academic_period_id
  WHERE lesson.id = NEW.lesson_id;

  SELECT membership.college_id, membership.status::text
    INTO owner_college_id, owner_status
  FROM college_memberships membership
  WHERE membership.id = NEW.faculty_owner_membership_id;

  IF course_college_id IS NULL OR period_college_id IS NULL
     OR owner_college_id IS NULL
     OR course_college_id IS DISTINCT FROM period_college_id
     OR course_college_id IS DISTINCT FROM owner_college_id
     OR (NEW.delivery_id IS NOT NULL AND
       (delivery_offering_id IS NULL
        OR delivery_offering_id IS DISTINCT FROM content_offering_id
        OR section_period_college_id IS NULL
        OR section_period_college_id IS DISTINCT FROM course_college_id)) THEN
    RAISE EXCEPTION 'faculty owner violates lesson content college or delivery scope'
      USING ERRCODE = '23514';
  END IF;

  -- Require an ACTIVE FACULTY membership only on first assignment/reassignment.
  -- Existing historical ownership remains intact if a faculty member later
  -- becomes suspended or loses a role. Consumer authorization must then deny
  -- mutations; deleting role rows must not erase authorship/ownership history.
  IF TG_OP = 'INSERT' THEN
    newly_assigned := true;
  ELSE
    newly_assigned := NEW.faculty_owner_membership_id
      IS DISTINCT FROM OLD.faculty_owner_membership_id;
  END IF;

  IF newly_assigned AND
     (owner_status IS DISTINCT FROM 'ACTIVE'
      OR NOT EXISTS (
        SELECT 1 FROM membership_roles membership_role
        WHERE membership_role.membership_id = NEW.faculty_owner_membership_id
          AND membership_role.role::text = 'FACULTY'
      )) THEN
    RAISE EXCEPTION 'faculty owner assignment requires an active faculty membership'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_faculty_owner$;

CREATE TRIGGER db05_lesson_content_faculty_owner_before_write
BEFORE INSERT OR UPDATE OF faculty_owner_membership_id, lesson_id, delivery_id
ON lesson_contents
FOR EACH ROW EXECUTE FUNCTION db05_lesson_content_faculty_owner_guard();

COMMIT;

-- REQUIRED ACCEPTANCE; NONE EXECUTED:
-- 1. Null owner valid for generic content; trusted admin/faculty permissions
--    still required by API to modify it.
-- 2. Active same-college FACULTY owner + compatible offering/section accepted.
-- 3. Cross-college membership, course department and offering period rejected
--    23514 even though independent FKs exist.
-- 4. Content delivery linked to a different offering or another college
--    rejected 23514.
-- 5. Learner-only, suspended or missing role membership cannot be newly
--    assigned owner; role loss after ownership does not delete history.
-- 6. Reassign owner under admin permission only; faculty cannot spoof
--    another faculty. Teacher assignment scope remains a service invariant.
-- 7. Reassigning faculty ownership never changes created_by_user_id.
-- 8. Upstream department, period, offering, learning path and membership
--    changes may invalidate existing ownership; row trigger insufficient.
-- 9. Concurrent reassignment, membership suspension, role revocation and
--    lesson reparent races require real disposable PostgreSQL tests.
-- 10. W01 integrates once with Drizzle schema+writer+reader and clean replay.
