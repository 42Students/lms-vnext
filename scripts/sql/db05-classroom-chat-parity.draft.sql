-- DB-008 / CHAT 6: CLASSROOM (DELIVERY) CHAT PARITY, SOURCE-ONLY DRAFT.
-- UNREGISTERED. Do not execute against a running environment.
-- Migration integrator / schema barrel owner: Chat 1 only.
-- Legacy oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- Sources: ClassroomMessage.java, BaseModel.java, ClassroomServiceImpl.java,
--   ClassroomMessageCreateDTO.java.
-- vNext: src/db/schema/discussions.ts and
--   src/modules/courses/discussion-service.ts.
--
-- vNext currently derives senderName from today's users.displayName and
-- hard-deletes messages. Legacy writes a trusted sender_name snapshot on POST
-- and deletes by setting inherited BaseModel.is_deleted=true. Those are
-- different persisted behaviors; keep the active/current display semantics
-- separate from an immutable author-name snapshot.
--
-- PRECONDITIONS:
-- 1. Chat 1 reconciles latest live schema and migration order.
-- 2. Later API wave switches writes to server-derived sender snapshot and
--    delete to an idempotent soft-delete; reads/pins never show deleted rows.
-- 3. Existing rows, if any, receive an explicit display-snapshot policy.
-- 4. Live PostgreSQL replay and tenant/role/negative/race tests are required.
-- 5. Upstream course/section/period reassignment safety is separately proved.

-- COMPANION-ONLY TENANT INTEGRITY DRAFT: do not register this as another
-- source of sender_name_snapshot/deleted_at or active-timeline indexes.
-- Canonical column+index proposal already exists in
-- scripts/sql/db05-classroom-message-history.draft.sql and is the ONE
-- manifest-listed classroom history draft. Chat 1 must fold this guard into
-- that migration (or register a dependency after it) exactly once, after
-- executed PostgreSQL tests. Two independent ALTER TABLE drafts would be an
-- unsafe collision: original text vs varchar(255) snapshots differ.

BEGIN;

-- The existing independent FKs permit a sender membership from college A
-- to reference a delivery from college B unless same-college is checked.
-- This staged trigger checks all three delivery scope paths on write:
-- course->department, offering->academic period, section->academic period.
-- An INSERT trigger alone does not protect later upstream reparenting.
CREATE OR REPLACE FUNCTION db05_class_chat_same_college_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_class_chat$
DECLARE
  course_college_id uuid;
  offering_college_id uuid;
  section_college_id uuid;
  sender_college_id uuid;
BEGIN
  SELECT dep.college_id, offering_period.college_id, section_period.college_id
    INTO course_college_id, offering_college_id, section_college_id
  FROM course_section_deliveries delivery
  INNER JOIN course_offerings offering ON offering.id = delivery.offering_id
  INNER JOIN courses course_row ON course_row.id = offering.course_id
  INNER JOIN departments dep ON dep.id = course_row.department_id
  INNER JOIN academic_periods offering_period
    ON offering_period.id = offering.academic_period_id
  INNER JOIN sections section_row ON section_row.id = delivery.section_id
  INNER JOIN academic_periods section_period
    ON section_period.id = section_row.academic_period_id
  WHERE delivery.id = NEW.delivery_id;

  SELECT membership.college_id INTO sender_college_id
  FROM college_memberships membership
  WHERE membership.id = NEW.sender_membership_id;

  IF course_college_id IS NULL OR offering_college_id IS NULL
     OR section_college_id IS NULL OR sender_college_id IS NULL
     OR course_college_id IS DISTINCT FROM offering_college_id
     OR course_college_id IS DISTINCT FROM section_college_id
     OR course_college_id IS DISTINCT FROM sender_college_id THEN
    RAISE EXCEPTION 'classroom message violates college boundary'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_class_chat$;

CREATE TRIGGER db05_class_chat_same_college_before_write
BEFORE INSERT OR UPDATE OF delivery_id, sender_membership_id
ON course_discussion_messages
FOR EACH ROW EXECUTE FUNCTION db05_class_chat_same_college_guard();

COMMIT;

-- PROOF GATES (none run here):
-- A. Same-college sender/section/offering/course accepted; each mismatched
--    college edge rejected (SQLSTATE 23514).
-- B. Server exclusively derives sender_name_snapshot at create time; a
--    later user rename leaves historic message attribution unchanged.
-- C. Delete sets deleted_at, retains audit record; list filters deleted_at
--    and pin/delete paths reject or consistently handle deleted messages.
-- D. Attempted author spoof, wrong-delivery post, wrong-class post, and
--    forbidden moderation fail; public reads cannot expose deleted messages.
-- E. Upstream reassignment of offering, academic period, section, department,
--    course and membership cannot invalidate existing message tenant scope.
-- F. No duplicate/named trigger conflicts on clean journal replay; real
--    PostgreSQL tests, API tests and CI acceptance pass on an exact SHA.
