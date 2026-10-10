-- DB08 W04 drive cohort targets - STAGING DRAFT ONLY.
-- W01 owns numbered Drizzle migrations, journal, and end-to-end replay.
-- Do NOT execute on a shared database until reconciled with canonical schemas.
CREATE TABLE placement_job_cohort_targets (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX placement_job_cohort_targets_job_cohort_uq ON placement_job_cohort_targets(job_id,cohort_id);
CREATE INDEX placement_job_cohort_targets_college_cohort_idx ON placement_job_cohort_targets(college_id,cohort_id);
CREATE INDEX placement_job_cohort_targets_college_job_idx ON placement_job_cohort_targets(college_id,job_id);

CREATE FUNCTION db08_assert_job_cohort_college() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE job_college uuid; cohort_college uuid; job_status varchar(24);
BEGIN
  SELECT college_id,status INTO job_college,job_status FROM placement_jobs WHERE id=NEW.job_id;
  SELECT dep.college_id INTO cohort_college
  FROM cohorts c JOIN programs p ON p.id=c.program_id
    JOIN departments dep ON dep.id=p.department_id WHERE c.id=NEW.cohort_id;
  IF job_college IS DISTINCT FROM NEW.college_id
      OR cohort_college IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'Drive cohort target crosses college boundary' USING ERRCODE='23514';
  END IF;
  IF job_status IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION 'Published drive targets require explicit notification workflow' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER db08_job_cohort_parent_guard
  BEFORE INSERT OR UPDATE ON placement_job_cohort_targets
  FOR EACH ROW EXECUTE FUNCTION db08_assert_job_cohort_college();

-- TODO(W01): parent-side reparent protection; real INSERT/UPDATE grants;
-- enforce at least one targeted cohort on job publish; retire NOT NULL season_id;
-- review company/job relationship college match and publish race using row lock.
-- W04 will wire managers' target builder and student application checks after
-- migration; until then this is source-only, not a runtime feature.
