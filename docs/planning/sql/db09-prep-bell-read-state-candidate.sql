-- DB-012 / Chat 3 - Source-backed draft, NOT migrated or executed.
-- Oracle: TpoStudentsReadService, TpoAuditService at legacy BE
-- 21bad59d4dfaf2fa11fdeaf9353327ce105697d5;
-- V161__tpo_v1_drives.sql, V165__tpo_v1_complete.sql and
-- V184__tpo_bell_read.sql. No old data to migrate in greenfield vNext.

-- Learner preparation assignments are independently persisted; they are NOT
-- interchangeable with a notification or a course enrollment.
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

-- WARN: Existing college_memberships(id,college_id) must have a unique
-- parent constraint at migration integration (coordinate CRM tenant-FK
-- proposals with Chat 1). Legacy prep_assignment.assessment_id is intentionally
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

-- Required tests (NOT EXECUTED):
-- 1. Learner A assignment references their own active college/eligible course;
--    forged learner B-college owner is rejected by a composite FK.
-- 2. Assignment producer accepts only an authorized LMS course, validates
--    deadline and dedupe, and cannot create an orphaned generic assessment ref.
-- 3. Same bell: reader A marked read, reader B still unread, even when
--    A and B belong to the same placement team; wrong-college bell rejected.
-- 4. Reader must hold current college TPO/eligible recruiter grant and active
--    identity; user FK alone is NOT authorization.
-- 5. Historical legacy shared `tpo_bell.read_at` fallback only applies if
--    actual history is migrated. New greenfield records use per-person state.
-- 6. Final actor-kind code RECRUITER (V193) maps to canonical user UUID,
--    never mix faculty id / recruiter id identity spaces.
-- 7. Deduped notifications and retention/reader privacy demonstrated under
--    actual disposable PostgreSQL concurrency fixtures.
