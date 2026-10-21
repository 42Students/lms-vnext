-- Internal notes per application (recruiter/placement only).
ALTER TABLE job_application ADD COLUMN internal_notes TEXT NULL;

-- Interview feedback (after round completion).
ALTER TABLE interview ADD COLUMN feedback_rating INT NULL;
ALTER TABLE interview ADD COLUMN feedback_comments TEXT NULL;
ALTER TABLE interview ADD COLUMN feedback_recommend TINYINT(1) NULL;
ALTER TABLE interview ADD COLUMN feedback_submitted_at DATETIME NULL;
ALTER TABLE interview ADD COLUMN feedback_submitted_by INT NULL;
