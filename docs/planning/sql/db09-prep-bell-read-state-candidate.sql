-- DB-012 / Chat 3 - Source-backed draft, NOT migrated or executed.
-- Oracle: TpoStudentsReadService, TpoAuditService at legacy BE
-- 21bad59d4dfaf2fa11fdeaf9353327ce105697d5;
-- V161__tpo_v1_drives.sql, V165__tpo_v1_complete.sql and
-- V184__tpo_bell_read.sql. No old data to migrate in greenfield vNext.

-- Learner preparation assignments are independently persisted; they are NOT
-- interchangeable with a notification or a course enrollment.
-- db09_has_active_tpo_actor is defined by the collaboration supplemental
-- candidate and must be registered earlier per the DB09 integration manifest.
CREATE TABLE placement_prep_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  learner_membership_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  due_at timestamptz,
  assigned_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_prep_assignments_owner_fk
    FOREIGN KEY (learner_membership_id, college_id)
    REFERENCES college_memberships(id, college_id)
    ON DELETE RESTRICT,
  CONSTRAINT placement_prep_assignments_learner_course_uq
    UNIQUE (learner_membership_id, course_id)
);
CREATE INDEX placement_prep_assignments_student_idx
  ON placement_prep_assignments(learner_membership_id,created_at);

CREATE FUNCTION db09_assert_prep_assignment_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles r ON r.membership_id = m.id
     WHERE m.id = NEW.learner_membership_id
       AND m.college_id = NEW.college_id
       AND m.status = 'ACTIVE'
       AND r.role = 'LEARNER'
  ) THEN
    RAISE EXCEPTION 'prep learner membership is not active in assignment college'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM courses c
      JOIN departments d ON d.id = c.department_id
     WHERE c.id = NEW.course_id
       AND c.status = 'ACTIVE'
       AND d.college_id = NEW.college_id
  ) THEN
    RAISE EXCEPTION 'prep course is not an active course in assignment college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.assigned_by_user_id IS NOT NULL
     AND NOT db09_has_active_tpo_actor(
       NEW.assigned_by_user_id,
       NEW.college_id
     ) THEN
    RAISE EXCEPTION 'prep assigning user lacks active TPO scope in assignment college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.due_at IS NOT NULL
     AND NEW.due_at < NEW.created_at - interval '5 minutes' THEN
    RAISE EXCEPTION 'prep due date is already past'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;
CREATE TRIGGER db09_prep_assignment_scope_guard
  BEFORE INSERT OR UPDATE OF
    college_id,learner_membership_id,course_id,due_at,assigned_by_user_id
  ON placement_prep_assignments
  FOR EACH ROW EXECUTE FUNCTION db09_assert_prep_assignment_scope();

-- Existing college_memberships(id,college_id) composite uniqueness is owned
-- by db09-parent-composite-keys-candidate.sql; W01 must register/deduplicate
-- that parent key before this child FK. Legacy prep_assignment.assessment_id is intentionally
-- retired for greenfield vNext: the frozen production UI only posts courseId,
-- the frozen backend tree has no generic assessment entity/table, and the
-- current prepProgress read path only renders course-backed rows. Do not invent
-- a polymorphic/unconstrained UUID FK. If a future product adds test-only prep,
-- introduce an explicit typed resource contract against course_quizzes or
-- course_assignments with real FKs and its own parity review.
-- The writer must also prove the chosen course belongs to the caller's
-- organization/authorized catalogue before insert.

-- Source `tpo_bell` is a college-wide event; V184 `tpo_bell_read` is the
-- actual per-reader state. The vNext user may have several college roles,
-- but a read must never clear the same bell for all other readers.
CREATE TABLE placement_tpo_bell_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  event_type varchar(80) NOT NULL,
  title varchar(255) NOT NULL,
  body text,
  action_href text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_bell_id_college_uq UNIQUE(id,college_id),
  CONSTRAINT placement_tpo_bell_title_ck CHECK(length(trim(title))>0)
);
CREATE INDEX placement_tpo_bell_college_time_idx
  ON placement_tpo_bell_items(college_id,created_at);

CREATE TABLE placement_tpo_bell_receipts (
  bell_id uuid NOT NULL,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  reader_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  read_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_bell_reads_pk
    PRIMARY KEY(bell_id,reader_user_id),
  CONSTRAINT placement_tpo_bell_reads_scoped_fk
    FOREIGN KEY (bell_id,college_id)
    REFERENCES placement_tpo_bell_items(id,college_id)
    ON DELETE RESTRICT
);
CREATE INDEX placement_tpo_bell_reads_reader_time_idx
  ON placement_tpo_bell_receipts(reader_user_id,read_at);

CREATE FUNCTION db09_assert_bell_reader_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT db09_has_active_tpo_actor(
    NEW.reader_user_id,
    NEW.college_id
  ) THEN
    RAISE EXCEPTION 'TPO bell reader lacks active TPO scope in bell college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_bell_reader_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,reader_user_id
  ON placement_tpo_bell_receipts
  FOR EACH ROW EXECUTE FUNCTION db09_assert_bell_reader_scope();

CREATE FUNCTION db09_reject_bell_item_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'TPO bell event history is append-only'
    USING ERRCODE = '23514';
END $$;
CREATE TRIGGER db09_bell_item_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_bell_items
  FOR EACH ROW EXECUTE FUNCTION db09_reject_bell_item_rewrite();

CREATE FUNCTION db09_reject_bell_receipt_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'TPO bell read receipt is append-only'
    USING ERRCODE = '23514';
END $$;
CREATE TRIGGER db09_bell_receipt_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_bell_receipts
  FOR EACH ROW EXECUTE FUNCTION db09_reject_bell_receipt_rewrite();

-- Required tests (NOT EXECUTED):
-- 1. Learner A assignment references their own ACTIVE college and an ACTIVE
--    course whose department belongs to that college; wrong-college learner,
--    course or assigning user is rejected.
-- 2. Assignment producer accepts only an authorized LMS course, validates
--    deadline and dedupe, and cannot create an orphaned generic assessment ref.
-- 3. Same bell: reader A marked read, reader B still unread, even when
--    A and B belong to the same placement team; wrong-college bell rejected.
-- 4. Reader must hold active TPO actor scope; an ordinary active learner
--    membership cannot mark TPO bell rows read. Recruiter notification
--    read-through remains a separate
--    DB09 relation and must not be mixed into the TPO bell receipt table.
-- 5. Historical legacy shared `tpo_bell.read_at` fallback only applies if
--    actual history is migrated. New greenfield records use per-person state.
-- 6. Final actor-kind code RECRUITER (V193) maps to canonical user UUID,
--    never mix faculty id / recruiter id identity spaces.
-- 7. Deduped notifications and retention/reader privacy demonstrated under
--    actual disposable PostgreSQL concurrency fixtures.

-- 8. Bell item identity/content and per-reader receipt rows are append-only;
--    direct SQL cannot rewrite an event or move a read timestamp after insert.
