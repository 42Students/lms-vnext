-- DB-008 / Chat 6: course CONTENT ancestry immutability companion.
-- UNREGISTERED SOURCE-ONLY DRAFT; W01 owns Drizzle registration and migration
-- ordering. Not a replacement for DB02 academic scope or the existing
-- db05-content-order-upstream-reparent.draft.sql (which protects order rows).
--
-- GAP: db05_content_order_upstream_reparent_guard() only blocks an ancestor
-- move when a lesson_content_delivery_sequences OVERRIDE exists. Many lessons
-- have content but no override. Moving the lesson/path/offering/delivery/section
-- underneath that content can silently change audience and tenant context.
--
-- Conservative candidate: when content has been authored, require an explicit
-- authorized content relocation workflow instead of silently moving its
-- ancestry. Empty lessons, paths, offerings and deliveries remain movable
-- unless a different DB02/DB05 guard prohibits the change.
--
-- Course lesson-content readers use (delivery_id IS NULL OR delivery_id =
-- requested delivery). Consequently, generic NULL-delivery content is
-- visible in EVERY section delivery attached to its offering. Moving such
-- a delivery (or section) changes the audience even when no content is
-- directly keyed to that delivery; both paths below must check generic
-- content by the delivery's OLD offering scope.
--
-- This pairs with db05_lesson_content_delivery_scope_guard(): it uses
-- transaction-level advisory key 605008003, acquired BEFORE checking any
-- descendants, under READ COMMITTED. Existing child guard uses the same key
-- on INSERT and on lesson_id/delivery_id UPDATE, preventing phantom content
-- insertion in the race window. The pre-existing ORDER override guard shares
-- that key too. W01 must integrate all three and prove two-connection races.
--
-- Does NOT cover: academic_periods.college_id, departments.college_id,
-- membership reparent, deletion cascades, DB06 assignment-only lessons, or
-- source-invalid orphaned content. Those require separate W01/DB02/DB06
-- guards and PostgreSQL acceptance before DB05 is marked ready.
BEGIN;

CREATE OR REPLACE FUNCTION db05_content_ancestry_has_content_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_content_ancestor$
DECLARE
  has_content boolean := false;
BEGIN
  -- Same lock/isolation discipline as child lesson_content scope guard.
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'content ancestry move requires read committed isolation pending proof'
      USING ERRCODE = '25001';
  END IF;

  PERFORM pg_advisory_xact_lock(605008003::bigint);

  IF TG_TABLE_NAME = 'course_lessons' THEN
    IF NEW.learning_path_id IS DISTINCT FROM OLD.learning_path_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM lesson_contents content
        WHERE content.lesson_id = OLD.id
      ) INTO has_content;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_learning_paths' THEN
    IF NEW.offering_id IS DISTINCT FROM OLD.offering_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM course_lessons lesson
        INNER JOIN lesson_contents content ON content.lesson_id = lesson.id
        WHERE lesson.learning_path_id = OLD.id
      ) INTO has_content;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_offerings' THEN
    IF NEW.course_id IS DISTINCT FROM OLD.course_id
       OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
       OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM course_learning_paths path
        INNER JOIN course_lessons lesson ON lesson.learning_path_id = path.id
        INNER JOIN lesson_contents content ON content.lesson_id = lesson.id
        WHERE path.offering_id = OLD.id
      ) INTO has_content;
      -- Delivery-targeted content can also be reached by the delivery even
      -- when data is already malformed. Reject rather than silently moving.
      IF NOT has_content THEN
        SELECT EXISTS (
          SELECT 1
          FROM course_section_deliveries delivery
          INNER JOIN lesson_contents content ON content.delivery_id = delivery.id
          WHERE delivery.offering_id = OLD.id
        ) INTO has_content;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_section_deliveries' THEN
    IF NEW.offering_id IS DISTINCT FROM OLD.offering_id
       OR NEW.section_id IS DISTINCT FROM OLD.section_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM lesson_contents content
        WHERE content.delivery_id = OLD.id
      ) INTO has_content;
      IF NOT has_content THEN
        SELECT EXISTS (
          SELECT 1
          FROM course_learning_paths path
          INNER JOIN course_lessons lesson ON lesson.learning_path_id = path.id
          INNER JOIN lesson_contents content ON content.lesson_id = lesson.id
          WHERE path.offering_id = OLD.offering_id
            AND content.delivery_id IS NULL
        ) INTO has_content;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'sections' THEN
    IF NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
       OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM course_section_deliveries delivery
        INNER JOIN lesson_contents content ON content.delivery_id = delivery.id
        WHERE delivery.section_id = OLD.id
      ) INTO has_content;
      IF NOT has_content THEN
        SELECT EXISTS (
          SELECT 1
          FROM course_section_deliveries delivery
          INNER JOIN course_learning_paths path ON path.offering_id = delivery.offering_id
          INNER JOIN course_lessons lesson ON lesson.learning_path_id = path.id
          INNER JOIN lesson_contents content ON content.lesson_id = lesson.id
          WHERE delivery.section_id = OLD.id
            AND content.delivery_id IS NULL
        ) INTO has_content;
      END IF;
    END IF;

  ELSE
    RAISE EXCEPTION 'unsupported DB05 content ancestor table: %', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  IF has_content THEN
    RAISE EXCEPTION 'content ancestry must not change while lesson content exists'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_content_ancestor$;

-- Five distinct triggers; W01 must avoid reusing these names elsewhere and
-- install the companion only after lesson_contents and DB02 base tables.
CREATE TRIGGER db05_authored_content_lesson_ancestor_guard
BEFORE UPDATE OF learning_path_id ON course_lessons
FOR EACH ROW EXECUTE FUNCTION db05_content_ancestry_has_content_guard();

CREATE TRIGGER db05_authored_content_path_ancestor_guard
BEFORE UPDATE OF offering_id ON course_learning_paths
FOR EACH ROW EXECUTE FUNCTION db05_content_ancestry_has_content_guard();

CREATE TRIGGER db05_authored_content_offering_ancestor_guard
BEFORE UPDATE OF course_id, cohort_id, academic_period_id ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db05_content_ancestry_has_content_guard();

CREATE TRIGGER db05_authored_content_delivery_ancestor_guard
BEFORE UPDATE OF offering_id, section_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db05_content_ancestry_has_content_guard();

CREATE TRIGGER db05_authored_content_section_ancestor_guard
BEFORE UPDATE OF cohort_id, academic_period_id ON sections
FOR EACH ROW EXECUTE FUNCTION db05_content_ancestry_has_content_guard();

COMMIT;

-- DISPOSABLE POSTGRES ACCEPTANCE MATRIX. ALL UNEXECUTED.
-- CA-01 An empty lesson can change learning_path_id if DB02 allows it.
-- CA-02 A lesson with content cannot change its learning_path_id -> 23514.
-- CA-03 A path with descendant lesson content cannot change offering -> 23514.
-- CA-04 Offering course/cohort/period change while authored content -> 23514.
-- CA-05 Offering with delivery-targeted content also rejects reparent -> 23514.
-- CA-06 Delivery with class-targeted OR generic offering-scoped content cannot
--       change offering/section; generic content is visible to that delivery.
-- CA-07 Section with attached class-targeted or generic offering content
--       cannot change cohort/period while its delivery serves that content.
-- CA-08 Same-value UPDATE on all five tables is allowed by this companion.
-- CA-09 Two sessions content INSERT vs lesson/path/offering move serialize,
--       never leave mismatched offering/section scope.
-- CA-10 Two sessions content INSERT vs delivery/section move serialize,
--       never leave wrongly targeted content.
-- CA-11 Non-READ-COMMITTED update rejects 25001 until race proof recorded.
-- CA-12 Existing content with NO delivery-order overrides still blocks move.
-- CA-13 A deleted or archived content row still blocks silent reparent,
--       preserving historical references; explicit migration can relocate.
-- CA-14 Clearing content in a trusted transaction permits reparent only if
--       residual discussions/progress/files/references are also accounted.
-- CA-15 DB02 academic-period/department and DB06 assignment-only ancestors
--       remain separately guarded; test consumer-to-producer integration.
-- CA-16 Clean journal replay, duplicate trigger checks, lock contention,
-- CA-17 When delivery moves but its offering contains only generic NULL-
--       delivery lesson content, reject 23514 (audience would change).
-- CA-18 When section moves cohort/period but has only generic content via
--       its existing deliveries, reject 23514 (audience would change).
--       rollback/SQLSTATE and consumer behavior executed on exact SHA.
