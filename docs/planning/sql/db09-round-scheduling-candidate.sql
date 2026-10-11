-- DB-012 / Chat 3, DATABASE phase. SOURCE DESIGN CANDIDATE ONLY.
-- Legacy V165__tpo_v1_complete.sql + V193__recruiter_naming.sql:
-- the final proposer code is RECRUITER, not HR. round_slot, round_assignment,
-- reschedule_request. Current vNext placement_application_round_exceptions
-- does not itself retain all legacy slot capacity/proposer/status, student
-- confirmation, notification, or request decision history.
--
-- NOT A REGISTERED MIGRATION AND NOT EXECUTED. Before integration, Chat 1
-- owns journal/barrel and Drizzle generation, DB08 owner must sign off job/
-- application/round ownership and scheduling API lifecycle.
--
-- Make composite job association enforceable for every child, even if
-- someone bypasses the app's college+job authorization code. The referenced
-- ids have ordinary UUID PKs; PostgreSQL also requires explicit composite
-- UNIQUE before a composite FK may reference them.
ALTER TABLE placement_job_rounds
  ADD CONSTRAINT placement_job_rounds_id_job_uq
  UNIQUE (id, job_id);

ALTER TABLE placement_applications
  ADD CONSTRAINT placement_applications_id_job_uq
  UNIQUE (id, job_id);

CREATE TABLE placement_round_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  round_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  room varchar(100),
  panel varchar(100),
  capacity integer NOT NULL DEFAULT 1,
  proposed_by varchar(10) NOT NULL DEFAULT 'TPO',
  status varchar(16) NOT NULL DEFAULT 'PROPOSED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version integer NOT NULL DEFAULT 1,
  CONSTRAINT placement_round_slots_round_job_fk
    FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_slots_id_round_job_uq
    UNIQUE (id, round_id, job_id),
  CONSTRAINT placement_round_slots_range_ck CHECK (ends_at > starts_at),
  CONSTRAINT placement_round_slots_capacity_ck CHECK (capacity > 0),
  CONSTRAINT placement_round_slots_proposer_ck
    CHECK (proposed_by IN ('TPO','RECRUITER')),
  CONSTRAINT placement_round_slots_status_ck
    CHECK (status IN ('PROPOSED','CONFIRMED')),
  CONSTRAINT placement_round_slots_version_ck CHECK (row_version > 0)
);
CREATE INDEX placement_round_slots_round_time_idx
  ON placement_round_slots(round_id, starts_at);

CREATE TABLE placement_round_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  round_id uuid NOT NULL,
  application_id uuid NOT NULL,
  slot_id uuid,
  room varchar(100),
  student_confirmed_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version integer NOT NULL DEFAULT 1,
  CONSTRAINT placement_round_assignments_round_job_fk
    FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_assignments_application_job_fk
    FOREIGN KEY (application_id, job_id)
    REFERENCES placement_applications(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_assignments_slot_round_job_fk
    FOREIGN KEY (slot_id, round_id, job_id)
    REFERENCES placement_round_slots(id, round_id, job_id)
    ON DELETE RESTRICT,
  CONSTRAINT placement_round_assignments_round_app_uq
    UNIQUE (round_id, application_id),
  CONSTRAINT placement_round_assignments_version_ck CHECK (row_version > 0)
);
CREATE INDEX placement_round_assignments_slot_idx
  ON placement_round_assignments(slot_id);

CREATE TABLE placement_round_reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  round_id uuid NOT NULL,
  application_id uuid NOT NULL,
  reason varchar(1000),
  preferred_times varchar(500),
  status varchar(16) NOT NULL DEFAULT 'PENDING',
  reply varchar(1000),
  decided_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  row_version integer NOT NULL DEFAULT 1,
  CONSTRAINT placement_round_reschedule_round_job_fk
    FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_reschedule_app_job_fk
    FOREIGN KEY (application_id, job_id)
    REFERENCES placement_applications(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_reschedule_status_ck
    CHECK (status IN ('PENDING','MOVED','KEPT')),
  CONSTRAINT placement_round_reschedule_decided_ck
    CHECK ((status='PENDING' AND decided_by_user_id IS NULL AND decided_at IS NULL)
        OR (status IN ('MOVED','KEPT') AND decided_by_user_id IS NOT NULL
            AND decided_at IS NOT NULL)),
  CONSTRAINT placement_round_reschedule_version_ck CHECK (row_version > 0)
);
CREATE INDEX placement_round_reschedule_status_idx
  ON placement_round_reschedule_requests(round_id, status, created_at);

-- Must not certify until tests execute against disposable PostgreSQL:
-- 1. forged round of job A + application of job B rejected by FK (23503)
-- 2. assignment of job A + slot of round B rejected (23503)
-- 3. duplicate round+application rejected (23505)
-- 4. invalid slot capacity/time range/reviewer status rejected (23514)
-- 5. concurrent assignment beyond capacity: one winner / serializable
--    or parent slot SELECT FOR UPDATE; DB FK/CHECK ALONE does not cap count
-- 6. two competing reschedule decisions must version-CAS, append review
--    history and notify the assigned learner; no phantom slot overwrite
-- 7. timezone, DST, cancellation, completed rounds and privacy of panels
--    reproduced from current legacy service+UI only after direct oracle check
-- 8. this draft must be reconciled with DB08-owned round exceptions; do not
--    duplicate active status machines without deliberate domain ownership.


-- Date-scoped student coordinator authorization for drive-day attendance.
-- Kept in this canonical scheduling candidate so W01 does not need to combine
-- two competing scheduling drafts.
ALTER TABLE placement_jobs
  ADD CONSTRAINT placement_jobs_id_college_uq
  UNIQUE (id, college_id);

ALTER TABLE college_memberships
  ADD CONSTRAINT college_memberships_id_college_uq
  UNIQUE (id, college_id);

CREATE TABLE placement_drive_coordinator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  job_id uuid NOT NULL,
  learner_membership_id uuid NOT NULL,
  on_date date NOT NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_drive_coordinators_job_college_fk
    FOREIGN KEY (job_id,college_id)
    REFERENCES placement_jobs(id,college_id) ON DELETE RESTRICT,
  CONSTRAINT placement_drive_coordinators_member_college_fk
    FOREIGN KEY (learner_membership_id,college_id)
    REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
  CONSTRAINT placement_drive_coordinators_scope_uq
    UNIQUE (job_id,learner_membership_id,on_date)
);
CREATE INDEX placement_drive_coordinators_member_date_idx
  ON placement_drive_coordinator_assignments(learner_membership_id,on_date);
