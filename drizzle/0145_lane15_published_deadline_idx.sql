-- Expire only still-PUBLISHED, unarchived drives after the deadline.
CREATE INDEX IF NOT EXISTS placement_jobs_published_deadline_idx
 ON placement_jobs(application_deadline)
 WHERE status = 'PUBLISHED' AND application_deadline IS NOT NULL;
