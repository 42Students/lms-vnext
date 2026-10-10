-- DB09 scheduling persistence premerge proposal.
-- NOT REGISTERED. NOT EXECUTED. Chat 1/W01 owns migration integration.

CREATE UNIQUE INDEX IF NOT EXISTS placement_job_rounds_id_job_uq
  ON placement_job_rounds(id, job_id);
CREATE UNIQUE INDEX IF NOT EXISTS placement_applications_id_job_uq
  ON placement_applications(id, job_id);
CREATE UNIQUE INDEX IF NOT EXISTS placement_jobs_id_college_uq
  ON placement_jobs(id, college_id);
CREATE UNIQUE INDEX IF NOT EXISTS college_memberships_id_college_uq
  ON college_memberships(id, college_id);

CREATE TABLE placement_round_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES placement_job_rounds(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  room varchar(100),
  panel varchar(100),
  capacity integer NOT NULL DEFAULT 1,
  proposed_by varchar(20) NOT NULL DEFAULT 'TPO',
  status varchar(16) NOT NULL DEFAULT 'PROPOSED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_round_slots_time_ck CHECK (ends_at > starts_at),
  CONSTRAINT placement_round_slots_capacity_ck CHECK (capacity >= 1),
  CONSTRAINT placement_round_slots_proposed_by_ck
    CHECK (proposed_by IN ('TPO','RECRUITER')),
  CONSTRAINT placement_round_slots_status_ck
    CHECK (status IN ('PROPOSED','CONFIRMED')),
  CONSTRAINT placement_round_slots_id_round_uq UNIQUE (id,round_id)
);
CREATE INDEX placement_round_slots_round_start_idx
  ON placement_round_slots(round_id,starts_at);

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
  CONSTRAINT placement_round_assignments_round_job_fk
    FOREIGN KEY (round_id,job_id)
    REFERENCES placement_job_rounds(id,job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_assignments_application_job_fk
    FOREIGN KEY (application_id,job_id)
    REFERENCES placement_applications(id,job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_assignments_slot_round_fk
    FOREIGN KEY (slot_id,round_id)
    REFERENCES placement_round_slots(id,round_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_assignments_round_application_uq
    UNIQUE (round_id,application_id)
);
CREATE INDEX placement_round_assignments_slot_idx
  ON placement_round_assignments(slot_id);
CREATE INDEX placement_round_assignments_application_idx
  ON placement_round_assignments(application_id);

CREATE TABLE placement_round_reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  round_id uuid NOT NULL,
  application_id uuid NOT NULL,
  reason text,
  preferred_times text,
  status varchar(16) NOT NULL DEFAULT 'PENDING',
  reply text,
  decided_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_round_reschedules_round_job_fk
    FOREIGN KEY (round_id,job_id)
    REFERENCES placement_job_rounds(id,job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_reschedules_application_job_fk
    FOREIGN KEY (application_id,job_id)
    REFERENCES placement_applications(id,job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_round_reschedules_status_ck
    CHECK (status IN ('PENDING','MOVED','KEPT')),
  CONSTRAINT placement_round_reschedules_decision_ck
    CHECK (
      (status='PENDING' AND decided_by_user_id IS NULL AND decided_at IS NULL)
      OR (status IN ('MOVED','KEPT') AND decided_at IS NOT NULL)
    )
);
CREATE INDEX placement_round_reschedules_round_status_idx
  ON placement_round_reschedule_requests(round_id,status,created_at);

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
