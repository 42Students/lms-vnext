-- PROPOSED ONLY. Not journaled/registered; do not run against production.
-- LEARNER-placements-13/25: stored saved drives, currently staged in
-- src/db/schema/placement-external.ts and guarded in saved-job-service.ts.
CREATE TABLE IF NOT EXISTS placement_saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_saved_jobs_member_job_uq UNIQUE(membership_id,job_id)
);
CREATE INDEX IF NOT EXISTS placement_saved_jobs_college_idx
  ON placement_saved_jobs(college_id,membership_id);

-- LEARNER-placements-35: do not use placement_drive_day_attendance as the
-- learner's confirmation; it is staff-owned live attendance.
-- A learner may record intention to attend only their own scheduled round.
CREATE TABLE IF NOT EXISTS placement_learner_round_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
  round_id uuid NOT NULL REFERENCES placement_job_rounds(id) ON DELETE RESTRICT,
  status varchar(16) NOT NULL DEFAULT 'CONFIRMED'
    CHECK (status IN ('CONFIRMED','CANCELLED')),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_learner_round_confirmations_uq UNIQUE(application_id,round_id)
);
CREATE INDEX IF NOT EXISTS placement_learner_round_confirmations_owner_idx
  ON placement_learner_round_confirmations(college_id,membership_id,updated_at DESC);
-- Registration must include a tenant-safe ownership check inside the write
-- transaction: active learner membership, application membership_id equals
-- confirmation membership_id, job college equals confirmation college_id,
-- round belongs to application's job and has SCHEDULED status. Also decide
-- whether an expired/absent round can be confirmed, rate limit changes and
-- record immutable activity + placement-cell notification.
-- Do not expose a learner 'Confirmed' chip until these checks + journal and
-- read/write service are registered and exercised.
