-- DB-008 / Chat 6. DB05/DB06 PRIVATE COURSE-RECEIPT TENANT GUARD.
-- UNREGISTERED SOURCE-ONLY COMPANION. DO NOT EXECUTE ON PRODUCTION.
-- W01 exclusively owns migration journal and schema barrel. W02 DB06 owns
-- the base staged docs/planning/sql/db06-assignment-private-files-candidate.sql.
-- This adds NO duplicate table, column, FK, index, upload API or bucket policy.
--
-- vNext source: course-upload-receipts-staged.ts, assessments.ts, courses.ts,
-- memberships.ts, private-object-storage.ts and assignment-file-service.ts.
-- The existing individual foreign keys do not establish same-college scope.
--
-- Prerequisites: course_upload_receipts and all referenced course/academic/
-- assignment/submission tables EXIST in migrated schema, private object grants
-- use current namespace/prefix convention, and W01 has reconciled DB16
-- immutable object identity triggers/migration order.
BEGIN;

CREATE OR REPLACE FUNCTION db05_course_receipt_tenant_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_course_receipt$
DECLARE
  owner_college_id uuid;
  target_period_college_id uuid;
  target_department_college_id uuid;
  target_offering_id uuid;
  content_delivery_id uuid;
  delivery_offering_id uuid;
  delivery_section_college_id uuid;
  submission_assignment_id uuid;
  submission_membership_id uuid;
  submission_delivery_id uuid;
  required_namespace text;
  required_key_prefix text;
  object_key_suffix text;
BEGIN
  SELECT membership.college_id INTO owner_college_id
    FROM college_memberships membership
   WHERE membership.id = NEW.owner_membership_id;

  IF owner_college_id IS NULL
     OR owner_college_id IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'upload receipt owner membership violates college boundary'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.purpose = 'ASSIGNMENT_SUBMISSION' THEN
    IF NEW.assignment_id IS NULL OR NEW.lesson_content_id IS NOT NULL THEN
      RAISE EXCEPTION 'assignment upload receipt must target only an assignment'
        USING ERRCODE = '23514';
    END IF;
    required_namespace := 'assignment-submission';

    SELECT period.college_id, department.college_id,
           offering.id, assignment.delivery_id
      INTO target_period_college_id, target_department_college_id,
           target_offering_id, content_delivery_id
      FROM course_assignments assignment
      INNER JOIN course_lessons lesson ON lesson.id = assignment.lesson_id
      INNER JOIN course_learning_paths path ON path.id = lesson.learning_path_id
      INNER JOIN course_offerings offering ON offering.id = path.offering_id
      INNER JOIN academic_periods period ON period.id = offering.academic_period_id
      INNER JOIN courses course_row ON course_row.id = offering.course_id
      INNER JOIN departments department ON department.id = course_row.department_id
     WHERE assignment.id = NEW.assignment_id;
  ELSIF NEW.purpose = 'COURSE_RESOURCE' THEN
    IF NEW.lesson_content_id IS NULL OR NEW.assignment_id IS NOT NULL
       OR NEW.consumed_by_submission_id IS NOT NULL THEN
      RAISE EXCEPTION 'course resource receipt has invalid target or submission'
        USING ERRCODE = '23514';
    END IF;
    required_namespace := 'course-resource';

    SELECT period.college_id, department.college_id,
           offering.id, content.delivery_id
      INTO target_period_college_id, target_department_college_id,
           target_offering_id, content_delivery_id
      FROM lesson_contents content
      INNER JOIN course_lessons lesson ON lesson.id = content.lesson_id
      INNER JOIN course_learning_paths path ON path.id = lesson.learning_path_id
      INNER JOIN course_offerings offering ON offering.id = path.offering_id
      INNER JOIN academic_periods period ON period.id = offering.academic_period_id
      INNER JOIN courses course_row ON course_row.id = offering.course_id
      INNER JOIN departments department ON department.id = course_row.department_id
     WHERE content.id = NEW.lesson_content_id;
  ELSE
    RAISE EXCEPTION 'invalid course upload receipt purpose'
      USING ERRCODE = '23514';
  END IF;

  IF target_period_college_id IS NULL
     OR target_department_college_id IS NULL
     OR target_offering_id IS NULL
     OR target_period_college_id IS DISTINCT FROM NEW.college_id
     OR target_department_college_id IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'course upload receipt target violates college boundary'
      USING ERRCODE = '23514';
  END IF;

  -- An optional assignment/content delivery cannot secretly point to another
  -- offering or another college's section/academic period.
  IF content_delivery_id IS NOT NULL THEN
    SELECT delivery.offering_id, section_period.college_id
      INTO delivery_offering_id, delivery_section_college_id
      FROM course_section_deliveries delivery
      INNER JOIN sections section_row ON section_row.id = delivery.section_id
      INNER JOIN academic_periods section_period
        ON section_period.id = section_row.academic_period_id
     WHERE delivery.id = content_delivery_id;

    IF delivery_offering_id IS NULL OR delivery_section_college_id IS NULL
       OR delivery_offering_id IS DISTINCT FROM target_offering_id
       OR delivery_section_college_id IS DISTINCT FROM NEW.college_id THEN
      RAISE EXCEPTION 'course receipt target delivery belongs to another scope'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.consumed_by_submission_id IS NOT NULL THEN
    IF NEW.purpose <> 'ASSIGNMENT_SUBMISSION' THEN
      RAISE EXCEPTION 'course resource receipt cannot bind a submission'
        USING ERRCODE = '23514';
    END IF;

    SELECT submission.assignment_id, submission.membership_id,
           submission.delivery_id
      INTO submission_assignment_id, submission_membership_id,
           submission_delivery_id
      FROM assignment_submissions submission
     WHERE submission.id = NEW.consumed_by_submission_id;

    IF submission_assignment_id IS NULL
       OR submission_membership_id IS DISTINCT FROM NEW.owner_membership_id
       OR submission_assignment_id IS DISTINCT FROM NEW.assignment_id THEN
      RAISE EXCEPTION 'receipt consumption does not match assignment and owner'
        USING ERRCODE = '23514';
    END IF;

    -- An assignment can be generic or delivery-scoped; every submission has
    -- its own delivery and must resolve to the SAME owning course offering.
    SELECT delivery.offering_id, section_period.college_id
      INTO delivery_offering_id, delivery_section_college_id
      FROM course_section_deliveries delivery
      INNER JOIN sections section_row ON section_row.id = delivery.section_id
      INNER JOIN academic_periods section_period
        ON section_period.id = section_row.academic_period_id
     WHERE delivery.id = submission_delivery_id;

    IF delivery_offering_id IS NULL
       OR delivery_offering_id IS DISTINCT FROM target_offering_id
       OR delivery_section_college_id IS DISTINCT FROM NEW.college_id
       OR (content_delivery_id IS NOT NULL
           AND submission_delivery_id IS DISTINCT FROM content_delivery_id) THEN
      RAISE EXCEPTION 'receipt consumed for submission from another delivery'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- This check validates the exact private storage key SHAPE, not merely a
  -- prefix: private/<college>/<membership>/<namespace>/<uuid>. It forbids
  -- extra path segments, '..' traversal, embedded URLs and arbitrary suffixes.
  -- It does NOT attest an object exists, is malware-clean, has the promised
  -- generation, or is readable by this actor. DB16/storage still prove that.
  required_key_prefix := 'private/' || NEW.college_id::text || '/' ||
    NEW.owner_membership_id::text || '/' || required_namespace || '/';

  IF left(NEW.object_key, length(required_key_prefix))
     IS DISTINCT FROM required_key_prefix THEN
    RAISE EXCEPTION 'course receipt object key violates private owner namespace'
      USING ERRCODE = '23514';
  END IF;

  object_key_suffix := substring(
    NEW.object_key FROM length(required_key_prefix) + 1
  );

  IF object_key_suffix !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'course receipt private object key must end with one uuid'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.upload_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'course receipt upload token hash must be sha256 hex'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_course_receipt$;

CREATE TRIGGER db05_course_receipt_tenant_before_write
BEFORE INSERT OR UPDATE OF college_id, owner_membership_id, purpose,
    assignment_id, lesson_content_id, object_key, upload_token_hash,
    consumed_by_submission_id
ON course_upload_receipts
FOR EACH ROW EXECUTE FUNCTION db05_course_receipt_tenant_guard();

COMMIT;

-- REQUIRED PRE-REGISTRATION ACCEPTANCE, ALL NOT RUN:
-- 1. Same-college ASSIGNMENT_SUBMISSION and COURSE_RESOURCE receipt accepted.
-- 2. Wrong-college membership, assignment offering-period, course department,
--    content lesson, assignment/content delivery and section period rejected.
-- 3. Wrong namespace/path, arbitrary object key, malformed sha256 hash rejected.
-- 4. Cross-learner, cross-assignment and cross-delivery consumption rejected.
-- 5. Private object generation/sha/malware attestation still checked by API.
-- 6. Assignment submission file link and receipt immutable identity/retention
--    verified with DB06/DB16; DO NOT add duplicate identity trigger here.
-- 7. Upstream reparent of membership, department, offering, assignment,
--    lesson/content/delivery/section/period must be prohibited or revalidated.
--    Child receipt trigger alone does NOT protect existing rows retroactively.
-- 8. Parallel receipt consumption, revoke/expire races, auth spoof, clean
--    PostgreSQL replay, rollback, negative tests and service test evidence.
