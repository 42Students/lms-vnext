-- LEARNER-placements-41: distinct vendor assessment submission cutoff.
-- Submit to orchestrator for numbered registration; results_due_at is NOT a take-by deadline.
ALTER TABLE placement_job_rounds
  ADD COLUMN IF NOT EXISTS assessment_due_at timestamptz;
CREATE INDEX IF NOT EXISTS placement_rounds_assessment_due_idx
  ON placement_job_rounds (assessment_due_at)
  WHERE assessment_due_at IS NOT NULL AND kind IN ('TEST', 'VENDOR_TEST');
