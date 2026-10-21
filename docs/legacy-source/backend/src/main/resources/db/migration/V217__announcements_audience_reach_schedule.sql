-- V217: announcements audience reach schedule
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Announcements V2 (docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md): an audience fixed when it is sent (a recipient list),
-- reach and reads against it, a button, scheduling, an end date, email as an option, Undo, reminders; 42 can pick colleges.
ALTER TABLE placement_announcement
  ADD COLUMN audience_kind VARCHAR(20) NOT NULL DEFAULT 'ALL' COMMENT 'Students: ALL | PLACEMENTS | BATCHES | BRANCHES | DRIVE. Placement cells: ALL_COLLEGES | COLLEGES',
  ADD COLUMN audience_json JSON NULL COMMENT 'batchIds / branches / jobId + stage / collegeIds, as picked',
  ADD COLUMN audience_label VARCHAR(255) NULL COMMENT 'Who it went to, in words',
  ADD COLUMN recipient_count INT NULL COMMENT 'Students (or placement cells) it went to when it was sent',
  ADD COLUMN job_id INT NULL COMMENT 'The drive, for a drive audience: students get an Open the drive button',
  ADD COLUMN link_label VARCHAR(60) NULL,
  ADD COLUMN link_url VARCHAR(500) NULL,
  ADD COLUMN send_at DATETIME NULL COMMENT 'UTC; null = sent at once',
  ADD COLUMN sent_at DATETIME NULL COMMENT 'When it went out; null while scheduled',
  ADD COLUMN show_until DATETIME NULL COMMENT 'UTC; after it students no longer see it (the cell sees Ended)',
  ADD COLUMN email TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN undo_group VARCHAR(64) NULL COMMENT 'The notices of this send, held for the Undo window',
  ADD COLUMN last_reminded_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS placement_announcement_recipient (
  announcement_id BIGINT NOT NULL,
  learner_id INT NOT NULL,
  PRIMARY KEY (announcement_id, learner_id),
  KEY idx_placement_announcement_recipient_learner (learner_id)
);

CREATE TABLE IF NOT EXISTS placement_announcement_college (
  announcement_id BIGINT NOT NULL,
  college_id INT NOT NULL,
  PRIMARY KEY (announcement_id, college_id),
  KEY idx_placement_announcement_college_college (college_id)
);

-- Old rows: stored HTML-escaped and escaped again on screen; store them as typed. They were sent at once, to everyone.
UPDATE placement_announcement
SET title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    body = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(body, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    sent_at = created_at,
    audience_kind = CASE WHEN audience = 'TPOS' THEN 'ALL_COLLEGES' ELSE 'ALL' END,
    audience_label = CASE WHEN audience = 'TPOS' THEN 'Every placement cell' ELSE 'All students' END;
