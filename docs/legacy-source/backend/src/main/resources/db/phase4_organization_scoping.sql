-- Phase 4: Organization Scoping Migration
-- Execute this SQL to add organization_id to required tables

-- Add organization_id to learner table
ALTER TABLE learner ADD COLUMN organization_id INT NULL;
-- Update existing learners to default organization (you may need to set this based on your data)
-- UPDATE learner SET organization_id = 1 WHERE organization_id IS NULL;

-- Add organization_id to job table
ALTER TABLE job ADD COLUMN organization_id INT NOT NULL DEFAULT 1;
-- Update existing jobs to default organization
-- UPDATE job SET organization_id = 1 WHERE organization_id IS NULL;

-- Add organization_id to job_application table (derived from job, but stored for performance)
ALTER TABLE job_application ADD COLUMN organization_id INT NULL;
-- Update existing applications
-- UPDATE job_application ja JOIN job j ON ja.job_id = j.id SET ja.organization_id = j.organization_id;

-- Add organization_id to faculty table (if not exists)
-- Check if column exists first, then add if needed
-- ALTER TABLE faculty ADD COLUMN organization_id INT NULL;

-- Add index for performance
CREATE INDEX idx_learner_org ON learner(organization_id);
CREATE INDEX idx_job_org ON job(organization_id);
CREATE INDEX idx_job_application_org ON job_application(organization_id);

-- Update job_application status to include new pipeline stages
-- Note: This is just documentation - the status is stored as VARCHAR
-- Valid statuses: APPLIED, SHORTLISTED, INTERVIEW, OFFERED, REJECTED, HIRED, SELECTED (legacy)


