-- SA-placements-projects-14 proposal; orchestrator must register a numbered migration.
-- The JSONB contains informational legacy terms only: never use it to authorize
-- learner visibility or eligibility, which are governed by college and policy tables.
ALTER TABLE placement_jobs ADD COLUMN IF NOT EXISTS legacy_posting_details jsonb;
