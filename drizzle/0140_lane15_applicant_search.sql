-- Organization-wide applicant searches must always join placement_jobs by college_id.
-- Retain deliberate per-role applicant cardinality and separate stage/history.
CREATE INDEX IF NOT EXISTS placement_applications_job_submitted_idx
  ON placement_applications (job_id, submitted_at);
