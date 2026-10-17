-- LEARNER-placements-41: persist the vendor test SUBMISSION deadline separately
-- from results_due_at (which is the expected result publication deadline).
-- Existing rounds are unknown/null; never invent a due date from result timing.
-- Orchestrator must register as a numbered migration and replay in PostgreSQL.
ALTER TABLE placement_job_rounds
  ADD COLUMN IF NOT EXISTS assessment_due_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_job_rounds
  ADD CONSTRAINT placement_job_rounds_assessment_due_ck
  CHECK (assessment_due_at IS NULL OR kind IN ('TEST','VENDOR_TEST'));
