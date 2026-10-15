-- Proposed P-S2-04, never imported by registered runtime.
-- Validate that each UUID belongs to the same college and offered class.
ALTER TABLE placement_job_eligibility_policies
  ADD COLUMN IF NOT EXISTS allowed_section_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];
-- On promotion read active section_enrollments joined via learner_program_enrollments
-- and enforce the check before learner INCLUDE override.
