-- V209: drive last saved by
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Recruiter phase 1, N10: the create-drive page says "Last saved by {name} at HH:MM DD MMM YYYY".
ALTER TABLE job ADD COLUMN last_saved_by_faculty_id INT NULL, ADD COLUMN last_saved_at DATETIME NULL;
