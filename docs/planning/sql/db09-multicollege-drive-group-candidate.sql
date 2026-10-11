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
  company_id uuid NOT NULL
    REFERENCES placement_companies(id) ON DELETE RESTRICT,
  shared_form jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT placement_recruiter_drive_groups_recruiter_company_fk
    FOREIGN KEY (recruiter_user_id, company_id)
    REFERENCES placement_recruiter_profiles(user_id, company_id)
    ON DELETE RESTRICT,
  CONSTRAINT placement_recruiter_drive_group_form_ck
    CHECK (shared_form IS NULL OR jsonb_typeof(shared_form) = 'object')
);
CREATE INDEX placement_recruiter_drive_groups_recruiter_time_idx
  ON placement_recruiter_drive_groups(recruiter_user_id, created_at);

CREATE FUNCTION db09_assert_drive_group_owner_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_profile_company uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       NEW.recruiter_user_id IS DISTINCT FROM OLD.recruiter_user_id
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
     ) THEN
    RAISE EXCEPTION 'recruiter drive group owner/company is immutable'
      USING ERRCODE = '23514';
  END IF;

  SELECT p.company_id
    INTO v_profile_company
    FROM placement_recruiter_profiles p
    JOIN placement_companies co ON co.id = p.company_id
    JOIN users u ON u.id = p.user_id
   WHERE p.user_id = NEW.recruiter_user_id
     AND p.status = 'ACTIVE'
     AND co.status = 'ACTIVE'
     AND u.platform_status = 'ACTIVE';

  IF v_profile_company IS NULL OR v_profile_company <> NEW.company_id THEN
    RAISE EXCEPTION 'drive group recruiter/company is not an active canonical pairing'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.created_by_user_id IS DISTINCT FROM NEW.recruiter_user_id THEN
    RAISE EXCEPTION 'drive group creator must be the recruiter owner'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_drive_group_owner_scope_guard
  BEFORE INSERT OR UPDATE OF recruiter_user_id,company_id,created_by_user_id
  ON placement_recruiter_drive_groups
  FOR EACH ROW EXECUTE FUNCTION db09_assert_drive_group_owner_scope();

ALTER TABLE placement_jobs
  ADD COLUMN recruiter_drive_group_id uuid
  REFERENCES placement_recruiter_drive_groups(id) ON DELETE RESTRICT;

CREATE INDEX placement_jobs_recruiter_group_idx
  ON placement_jobs(recruiter_drive_group_id, college_id);

CREATE UNIQUE INDEX placement_jobs_recruiter_group_college_uq
  ON placement_jobs(recruiter_drive_group_id, college_id)
  WHERE recruiter_drive_group_id IS NOT NULL;

CREATE FUNCTION db09_assert_drive_group_job_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_group_recruiter uuid;
  v_group_company uuid;
  v_relationship_company uuid;
BEGIN
  IF NEW.recruiter_drive_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT recruiter_user_id, company_id
    INTO v_group_recruiter, v_group_company
    FROM placement_recruiter_drive_groups
   WHERE id = NEW.recruiter_drive_group_id;

  IF v_group_recruiter IS NULL OR v_group_company IS NULL THEN
    RAISE EXCEPTION 'recruiter drive group does not exist'
      USING ERRCODE = '23503';
  END IF;

  SELECT company_id
    INTO v_relationship_company
    FROM placement_company_relationships
   WHERE id = NEW.company_relationship_id
     AND college_id = NEW.college_id
     AND status = 'ACTIVE';

  IF v_relationship_company IS NULL
     OR v_relationship_company <> v_group_company THEN
    RAISE EXCEPTION 'drive group company does not match child job relationship'
      USING ERRCODE = '23514';
  END IF;

  -- Legacy RecruiterPlanDriveService creates grouped jobs as this same recruiter.
  IF NEW.created_by_user_id IS DISTINCT FROM v_group_recruiter THEN
    RAISE EXCEPTION 'grouped job creator must be the group recruiter'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM placement_recruiter_college_grants g
      JOIN placement_company_relationships r
        ON r.id = g.company_relationship_id
      JOIN placement_recruiter_profiles p
        ON p.user_id = g.recruiter_user_id
      JOIN placement_companies co
        ON co.id = p.company_id
      JOIN users u
        ON u.id = p.user_id
      JOIN colleges c
        ON c.id = r.college_id
     WHERE g.recruiter_user_id = v_group_recruiter
       AND g.status = 'ACTIVE'
       AND p.status = 'ACTIVE'
       AND co.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND c.status = 'ACTIVE'
       AND r.id = NEW.company_relationship_id
       AND r.college_id = NEW.college_id
       AND r.company_id = v_group_company
       AND p.company_id = v_group_company
       AND r.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'drive group recruiter lacks active grant for child job college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;
CREATE TRIGGER db09_drive_group_job_scope_guard
  BEFORE INSERT OR UPDATE OF
    recruiter_drive_group_id,college_id,company_relationship_id
  ON placement_jobs
  FOR EACH ROW EXECUTE FUNCTION db09_assert_drive_group_job_scope();

-- Proof requirements prior to adoption:
-- (1) same recruiter and normalized global company for all jobs sharing a
--     group, but each job separately authorized by a LIVE college grant;
-- (2) per-college job status, decisions, dates, permissions and publishing
--     are independent; group does not authorize cross-college reads;
-- (3) one child job per group+college is staged as a partial UNIQUE because
--     the active RecruiterPlanDriveService creates one Job per chosen college
--     and addCollege adds exactly one new college copy.
-- (4) shared_form may be null in legacy; do not accidentally require a form,
--     leak it in student/recruiter public projections, or deserialize
--     arbitrary JSON without size/shape validation.
-- (5) app-level group creation must atomically persist child job references
--     where required, avoiding orphaned partially succeeded requests;
--     import/backfill is out of scope (vNext is greenfield).
-- (6) after DB08/Chat1 review, add Drizzle schema and compose disposable
--     PostgreSQL FK, tenant isolation and rejection tests.
-- (7) recruiter/company composite FK rejects a group pairing a recruiter to a
--     company other than placement_recruiter_profiles.company_id.
-- (8) a grouped child job whose company relationship belongs to another
--     company or lacks an ACTIVE grant for the group recruiter is rejected.
-- (9) concurrent attempts to attach two child jobs for the same group+college
--     yield one winner via placement_jobs_recruiter_group_college_uq.

-- (10) group owner/company cannot be changed after creation; when creator
--      provenance is stored it must equal the recruiter owner.
-- (11) adding a child job after recruiter/user/company/college archival is
--      rejected even if a stale grant row still says ACTIVE.
