-- DB-012 / Chat 3: MULTI-COLLEGE RECRUITER DRIVE GROUP CONTRACT
-- NOT REGISTERED; NO MIGRATION / POSTGRES EXECUTION PROOF.
-- Legacy source: V161__tpo_v1_drives.sql + V193__recruiter_naming.sql
-- + RecruiterPlanDriveService.java@21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- ACTIVE behavior: one drive_group snapshot, multiple jobs for different
-- colleges under job.drive_group_id; same stored group may be opened again
-- to add a newly authorized college. Independent placement seasons/policy
-- and approval lifecycle per child job must remain isolated.

CREATE TABLE placement_recruiter_drive_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_user_id uuid
    REFERENCES placement_recruiter_profiles(user_id) ON DELETE RESTRICT,
  company_id uuid
    REFERENCES placement_companies(id) ON DELETE RESTRICT,
  shared_form jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT placement_recruiter_drive_group_form_ck
    CHECK (shared_form IS NULL OR jsonb_typeof(shared_form) = 'object')
);
CREATE INDEX placement_recruiter_drive_groups_recruiter_time_idx
  ON placement_recruiter_drive_groups(recruiter_user_id, created_at);

ALTER TABLE placement_jobs
  ADD COLUMN recruiter_drive_group_id uuid
  REFERENCES placement_recruiter_drive_groups(id) ON DELETE RESTRICT;

CREATE INDEX placement_jobs_recruiter_group_idx
  ON placement_jobs(recruiter_drive_group_id, college_id);

-- Proof requirements prior to adoption:
-- (1) same recruiter and normalized global company for all jobs sharing a
--     group, but each job separately authorized by a LIVE college grant;
-- (2) per-college job status, decisions, dates, permissions and publishing
--     are independent; group does not authorize cross-college reads;
-- (3) one child job per group+college unless current source expressly
--     permits multiples. Consider UNIQUE partial index only after contract
--     and legacy concurrency analysis.
-- (4) shared_form may be null in legacy; do not accidentally require a form,
--     leak it in student/recruiter public projections, or deserialize
--     arbitrary JSON without size/shape validation.
-- (5) app-level group creation must atomically persist child job references
--     where required, avoiding orphaned partially succeeded requests;
--     import/backfill is out of scope (vNext is greenfield).
-- (6) after DB08/Chat1 review, add Drizzle schema and compose disposable
--     PostgreSQL FK, tenant isolation and rejection tests.
