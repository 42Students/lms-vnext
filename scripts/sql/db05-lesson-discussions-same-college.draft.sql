-- DB-008 Chat6: UNREGISTERED COMPANION tenant-guard strengthening.
-- This is NOT an eighth independent DB05 migration.
-- DO NOT run/register on main or deploy against any live environment.
-- Chat 1 ONLY must fold this replacement into the canonical
-- scripts/sql/db05-lesson-content-discussions.draft.sql migration ONCE.
--
-- The first candidate's guard checked course offering period and membership,
-- but NOT the course.department's college, NOT optional content delivery's
-- offering/section college. Those independent FKs permit wrong-tenant
-- links despite a single superficially valid offering-period route.
--
-- vNext source: src/db/schema/courses.ts, src/db/schema/academics.ts,
-- src/db/schema/departments.ts, src/db/schema/memberships.ts.
-- BE oracle: 21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- Distinct from CLASSROOM chat and LEARNER PROGRESS companions.
BEGIN;

-- Replaces the function installed by db05-lesson-content-discussions DRAFT.
-- Reuses the existing trigger name and does not install a second trigger.
CREATE OR REPLACE FUNCTION db05_lesson_discussions_tenant_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_lesson_discussions_college$
DECLARE
  content_period_college_id uuid;
  course_department_college_id uuid;
  author_college_id uuid;
  resolver_college_id uuid;
  content_offering_id uuid;
  content_delivery_id uuid;
  delivery_offering_id uuid;
  delivery_section_period_college_id uuid;
BEGIN
  SELECT offering_period.college_id,
         department.college_id,
         offering.id,
         content.delivery_id,
         delivery.offering_id,
         section_period.college_id
    INTO content_period_college_id,
         course_department_college_id,
         content_offering_id,
         content_delivery_id,
         delivery_offering_id,
         delivery_section_period_college_id
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id = content.lesson_id
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN academic_periods offering_period ON offering_period.id = offering.academic_period_id
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments department ON department.id = course_row.department_id
  LEFT JOIN course_section_deliveries delivery ON delivery.id = content.delivery_id
  LEFT JOIN sections section_row ON section_row.id = delivery.section_id
  LEFT JOIN academic_periods section_period ON section_period.id = section_row.academic_period_id
  WHERE content.id = NEW.lesson_content_id;

  SELECT membership.college_id INTO author_college_id
  FROM college_memberships membership
  WHERE membership.id = NEW.author_membership_id;

  IF content_period_college_id IS NULL
     OR course_department_college_id IS NULL
     OR author_college_id IS NULL
     OR content_period_college_id IS DISTINCT FROM course_department_college_id
     OR content_period_college_id IS DISTINCT FROM author_college_id
     OR content_period_college_id IS DISTINCT FROM NEW.college_id
     OR (content_delivery_id IS NOT NULL AND
       (delivery_offering_id IS NULL
        OR delivery_offering_id IS DISTINCT FROM content_offering_id
        OR delivery_section_period_college_id IS DISTINCT FROM content_period_college_id)) THEN
    RAISE EXCEPTION 'lesson discussion violates course/content/author college boundary'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.resolved_by_membership_id IS NOT NULL THEN
    SELECT membership.college_id INTO resolver_college_id
    FROM college_memberships membership
    WHERE membership.id = NEW.resolved_by_membership_id;

    IF resolver_college_id IS NULL
       OR resolver_college_id IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'lesson discussion resolver violates college boundary'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db05_lesson_discussions_college$;

COMMIT;

-- Tests NOT RUN. Mandatory gate before integration:
-- 1. Same-college author and offering course/period plus optional delivery -> OK.
-- 2. Course.department college != offering period college -> REJECT 23514.
-- 3. Author membership college != lesson content college -> REJECT 23514.
-- 4. NEW.college_id spoof -> REJECT 23514.
-- 5. Content optional delivery points to different offering -> REJECT 23514.
-- 6. Delivery section academic period belongs to another college -> 23514.
-- 7. Wrong-college resolver membership -> REJECT 23514.
-- 8. Later UPDATE lesson content delivery/course/lesson, offerings, periods,
--    departments or college memberships can reparent scope *upstream* without
--    firing this child trigger. Must guard parent writes separately.
-- 9. This code replaces a function once; no duplicate trigger or index.
-- 10. Disposable Postgres replay, cross-tenant API negative and race tests.
