-- Reapplying (after a withdraw) reactivates the same application row and overwrites its
-- resumeUrl in place with zero record of what was there before. Purely additive — the primary
-- resume_url column is untouched.
ALTER TABLE job_application ADD COLUMN resume_history JSON NULL AFTER resume_url;
