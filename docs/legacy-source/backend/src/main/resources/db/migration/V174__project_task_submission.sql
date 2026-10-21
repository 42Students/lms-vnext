-- Per-task submission: a learner attaches a link (commit, deployed URL, Drive file, whatever
-- fits their work) when moving their own task to IN_REVIEW. Link-only by design -- no file
-- storage at task granularity (see docs/ discussion: task-level review happens near-real-time,
-- so link rot isn't a real risk there the way it is for the one long-lived Final Submission
-- record). submitted_by/submitted_at are real lifecycle-specific attribution fields, not reused
-- from the generic updated_by/updated_at -- the exact mistake the sprint attribution audit fix
-- (V173-era) called out and corrected elsewhere in this same lifecycle.
ALTER TABLE project_task
    ADD COLUMN submission_url VARCHAR(2048) NULL AFTER blocker_reason,
    ADD COLUMN submitted_by INT NULL AFTER submission_url,
    ADD COLUMN submitted_at DATETIME NULL AFTER submitted_by;
