-- Placement vNext PVN-001.11: an assessment link may be application-specific.
-- Job.assessment_url remains the reusable default; this column stores a one-off link for the
-- affected candidate without silently changing future candidates' default.
ALTER TABLE job_application
    ADD COLUMN assessment_url TEXT NULL
        COMMENT 'Application-specific assessment link. When null, learner/notification surfaces fall back to job.assessment_url.';
