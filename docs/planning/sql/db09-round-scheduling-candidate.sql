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
-- someone bypasses app authorization. Required parent composite UNIQUE keys
-- are centralized in db09-parent-composite-keys-candidate.sql; this file owns
-- only the scheduling child relations.

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

CREATE FUNCTION db09_assert_round_assignment_capacity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_capacity integer;
  v_status varchar(16);
  v_booked integer;
BEGIN
  IF NEW.slot_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT capacity,status
    INTO v_capacity,v_status
    FROM placement_round_slots
   WHERE id = NEW.slot_id
     AND round_id = NEW.round_id
     AND job_id = NEW.job_id
   FOR UPDATE;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'round assignment slot does not belong to assignment round/job'
      USING ERRCODE = '23503';
  END IF;
  IF v_status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'round assignment requires a confirmed slot'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*)
    INTO v_booked
    FROM placement_round_assignments a
   WHERE a.slot_id = NEW.slot_id
     AND a.id <> NEW.id;

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'round slot capacity exceeded'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_round_assignment_capacity_guard
  BEFORE INSERT OR UPDATE OF slot_id,round_id,job_id
  ON placement_round_assignments
  FOR EACH ROW EXECUTE FUNCTION db09_assert_round_assignment_capacity();

CREATE FUNCTION db09_assert_round_slot_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_booked integer;
BEGIN
  SELECT count(*)
    INTO v_booked
    FROM placement_round_assignments
   WHERE slot_id = OLD.id;

  IF NEW.capacity < v_booked THEN
    RAISE EXCEPTION 'round slot capacity cannot be reduced below booked count'
      USING ERRCODE = '23514';
  END IF;
  IF v_booked > 0 AND NEW.status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'booked round slot cannot become unconfirmed'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_round_slot_mutation_guard
  BEFORE UPDATE OF capacity,status
  ON placement_round_slots
  FOR EACH ROW EXECUTE FUNCTION db09_assert_round_slot_mutation();

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
-- 5. concurrent assignment beyond capacity is serialized by locking the slot
--    row in db09_round_assignment_capacity_guard; over-capacity insert loses
-- 6. two competing reschedule decisions must version-CAS, append review
--    history and notify the assigned learner; no phantom slot overwrite
-- 7. timezone, DST, cancellation, completed rounds and privacy of panels
--    reproduced from current legacy service+UI only after direct oracle check
-- 8. this draft must be reconciled with DB08-owned round exceptions; do not
--    duplicate active status machines without deliberate domain ownership.
-- 9. booked slots cannot be unconfirmed or shrunk below current bookings.
-- 10. coordinator row requires ACTIVE LEARNER membership in the same college;
--     assigning user, when present, must hold ACTIVE same-college membership.


-- Date-scoped student coordinator authorization for drive-day attendance.
-- Parent (id,college_id) keys for jobs/memberships come from the centralized
-- DB09 parent-key candidate; this canonical file owns the child table.
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


CREATE FUNCTION db09_assert_drive_coordinator_principal_scope() RETURNS trigger
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
    RAISE EXCEPTION 'drive coordinator must be an active learner in the job college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.created_by_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM college_memberships m
     WHERE m.user_id = NEW.created_by_user_id
       AND m.college_id = NEW.college_id
       AND m.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'drive coordinator assigning user is not active in job college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;
CREATE TRIGGER db09_drive_coordinator_principal_scope_guard
  BEFORE INSERT OR UPDATE OF
    college_id,job_id,learner_membership_id,created_by_user_id
  ON placement_drive_coordinator_assignments
  FOR EACH ROW EXECUTE FUNCTION db09_assert_drive_coordinator_principal_scope();
