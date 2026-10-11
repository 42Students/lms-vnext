-- DB-008 / Chat 6. DB05 LESSON-CONTENT DELIVERY ORDER SCOPE COMPANION.
-- UNREGISTERED SOURCE-ONLY SQL; not an independent numbered migration.
-- Base candidate: docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql
-- W01 owns schema barrel, journal and database replay. No duplicate table,
-- columns, sequence indexes or destructive mutation added by this companion.
--
-- Source: src/modules/courses/lesson-content-order-service.ts checks lesson
-- offering == delivery offering and content.delivery_id nullable/same delivery;
-- src/modules/courses/delivery-service.ts requires offering/section college,
-- cohort and academic period parity.
--
-- FK(lesson_content_id) and FK(delivery_id) alone allow raw SQL to mix a
-- lesson of offering A with delivery B, even across tenant/term boundaries.
BEGIN;

CREATE OR REPLACE FUNCTION db05_content_delivery_order_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_delivery_content_order$
DECLARE
  content_offering_id uuid;
  content_scoped_delivery_id uuid;
  content_status text;
  offering_cohort_id uuid;
  offering_period_id uuid;
  offering_college_id uuid;
  owning_course_college_id uuid;
  target_delivery_offering_id uuid;
  target_section_cohort_id uuid;
  target_section_period_id uuid;
  target_section_college_id uuid;
BEGIN
  SELECT offering.id, content.delivery_id, content.status::text,
         offering.cohort_id, offering.academic_period_id,
         period.college_id, department.college_id
    INTO content_offering_id, content_scoped_delivery_id, content_status,
         offering_cohort_id, offering_period_id,
         offering_college_id, owning_course_college_id
    FROM lesson_contents content
    INNER JOIN course_lessons lesson ON lesson.id = content.lesson_id
    INNER JOIN course_learning_paths path ON path.id = lesson.learning_path_id
    INNER JOIN course_offerings offering ON offering.id = path.offering_id
    INNER JOIN academic_periods period ON period.id = offering.academic_period_id
    INNER JOIN courses course_row ON course_row.id = offering.course_id
    INNER JOIN departments department ON department.id = course_row.department_id
   WHERE content.id = NEW.lesson_content_id;

  SELECT delivery.offering_id, section_row.cohort_id,
         section_row.academic_period_id, section_period.college_id
    INTO target_delivery_offering_id, target_section_cohort_id,
         target_section_period_id, target_section_college_id
    FROM course_section_deliveries delivery
    INNER JOIN sections section_row ON section_row.id = delivery.section_id
    INNER JOIN academic_periods section_period
      ON section_period.id = section_row.academic_period_id
   WHERE delivery.id = NEW.delivery_id;

  IF content_offering_id IS NULL OR target_delivery_offering_id IS NULL
     OR content_offering_id IS DISTINCT FROM target_delivery_offering_id
     OR content_scoped_delivery_id IS NOT NULL
        AND content_scoped_delivery_id IS DISTINCT FROM NEW.delivery_id
     OR offering_college_id IS NULL OR owning_course_college_id IS NULL
     OR target_section_college_id IS NULL
     OR offering_college_id IS DISTINCT FROM owning_course_college_id
     OR offering_college_id IS DISTINCT FROM target_section_college_id
     OR offering_cohort_id IS DISTINCT FROM target_section_cohort_id
     OR offering_period_id IS DISTINCT FROM target_section_period_id THEN
    RAISE EXCEPTION 'lesson content order violates offering delivery and college scope'
      USING ERRCODE = '23514';
  END IF;

  IF content_status = 'ARCHIVED' THEN
    RAISE EXCEPTION 'archived lesson content cannot receive a delivery order'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_delivery_content_order$;

CREATE TRIGGER db05_content_delivery_order_before_write
BEFORE INSERT OR UPDATE OF lesson_content_id, delivery_id, sequence
ON lesson_content_delivery_sequences
FOR EACH ROW EXECUTE FUNCTION db05_content_delivery_order_scope_guard();

COMMIT;

-- REQUIRED EXECUTED GATES (NONE RUN):
-- 1. Shared lesson content may have order overrides for each delivery within
--    its offering; delivery-specific content only for its own delivery.
-- 2. Reject different offering, college, cohort or academic period, even
--    when both independent foreign keys individually exist.
-- 3. Reject archived content; tolerate source-valid sequence >= 0 and
--    atomic reordering within the same lesson/delivery.
-- 4. The current table has no persisted lesson_id, so a UNIQUE per
--    (delivery_id, lesson_id, sequence) cannot be declared directly. Without
--    that uniqueness, direct SQL can create duplicate order positions in one
--    lesson. Decide whether to add scoped lesson_id with composite FK/index,
--    or implement another DB-level concurrency-safe invariant.
-- 5. Upstream changes to lesson/content delivery, path offering, section,
--    course department, cohort or period can invalidate existing override rows
--    without firing this child trigger. Prohibit/revalidate reparenting.
-- 6. Execute disposable PG wrong-college/term, duplicate sequence,
--    concurrent reorder, replay, drift, rollback and consumer sorting tests.
