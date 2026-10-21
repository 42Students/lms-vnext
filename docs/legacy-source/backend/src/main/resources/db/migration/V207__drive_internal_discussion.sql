-- V207: drive internal discussion
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Recruiter phase 1, N7: a drive's internal discussion, for the placement team only. The discussion with the company stays in
-- tpo_message_thread (job_id); this one is never shown to a recruiter.
CREATE TABLE IF NOT EXISTS drive_internal_note (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  college_id INT NOT NULL,
  author_faculty_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_drive_internal_note_job (job_id, id)
);
