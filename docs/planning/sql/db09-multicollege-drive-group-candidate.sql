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
  recruiter_user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  shared_form jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT placement_recruiter_drive_group_recruiter_company_fk
    FOREIGN KEY (recruiter_user_id, company_id)
    REFERENCES placement_recruiter_profiles(user_id, company_id)
    ON DELETE RESTRICT,
  CONSTRAINT placement_recruiter_drive_group_creator_ck
    CHECK (created_by_user_id = recruiter_user_id),
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

CREATE UNIQUE INDEX placement_jobs_recruiter_group_college_uq
  ON placement_jobs(recruiter_drive_group_id, college_id)
  WHERE recruiter_drive_group_id IS NOT NULL;

-- A child job may join a group only when the group recruiter still has an
-- ACTIVE grant to that exact college-company relationship and the job creator
-- is the same recruiter. Historical linkage remains after later revocation.
CREATE FUNCTION db09_assert_drive_group_job_scope() RETURNS trigger
LANGUAGE plpgsql AS $
DECLARE
  group_recruiter uuid;
  group_company uuid;
BEGIN
  IF NEW.recruiter_drive_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT recruiter_user_id, company_id
    INTO group_recruiter, group_company
    FROM placement_recruiter_drive_groups
   WHERE id = NEW.recruiter_drive_group_id;

  IF group_recruiter IS NULL OR group_company IS NULL THEN
    RAISE EXCEPTION 'recruiter drive group not found'
      USING ERRCODE='23503';
  END IF;

  IF NEW.created_by_user_id IS DISTINCT FROM group_recruiter THEN
    RAISE EXCEPTION 'grouped job creator must be the group recruiter'
      USING ERRCODE='23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM placement_company_relationships rel
      JOIN placement_recruiter_college_grants grant
        ON grant.company_relationship_id = rel.id
       AND grant.recruiter_user_id = group_recruiter
       AND grant.status = 'ACTIVE'
     WHERE rel.id = NEW.company_relationship_id
       AND rel.college_id = NEW.college_id
       AND rel.company_id = group_company
       AND rel.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'group recruiter lacks active access to the job company relationship'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END $;

CREATE TRIGGER db09_drive_group_job_scope_guard
  BEFORE INSERT OR UPDATE OF recruiter_drive_group_id,company_relationship_id,college_id,created_by_user_id
  ON placement_jobs
  FOR EACH ROW EXECUTE FUNCTION db09_assert_drive_group_job_scope();

-- Proof requirements prior to adoption:
-- (1) same recruiter and normalized global company for all jobs sharing a
--     group, with each attachment requiring a LIVE college grant at write time;
-- (2) per-college job status, decisions, dates, permissions and publishing
--     are independent; group does not authorize cross-college reads;
-- (3) one child job per group+college is enforced. Legacy source describes
--     one Job per chosen college and addCollege as adding a new college; a
--     repeated same-college request is treated as duplicate intent.
-- (4) shared_form may be null in legacy; do not accidentally require a form,
--     leak it in student/recruiter public projections, or deserialize
--     arbitrary JSON without size/shape validation.
-- (5) app-level group creation must atomically persist child job references
--     where required, avoiding orphaned partially succeeded requests;
--     import/backfill is out of scope (vNext is greenfield).
-- (6) after DB08/Chat1 review, add Drizzle schema and compose disposable
--     PostgreSQL FK, tenant isolation and rejection tests.
