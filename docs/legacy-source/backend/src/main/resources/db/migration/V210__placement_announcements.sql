-- V210: placement announcements
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Recruiter phase 1 / phase 2, N12: Announcements. A placement cell writes to its students (college_id set, audience STUDENTS);
-- 42 writes to every placement cell (college_id NULL, audience TPOS). Reads are recorded so each side sees what is new.
CREATE TABLE IF NOT EXISTS placement_announcement (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id INT NULL,
  audience VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  author_type VARCHAR(20) NOT NULL,
  author_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_placement_announcement_scope (audience, college_id, is_deleted, id)
);

CREATE TABLE IF NOT EXISTS placement_announcement_read (
  announcement_id BIGINT NOT NULL,
  reader_type VARCHAR(20) NOT NULL,
  reader_id INT NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (announcement_id, reader_type, reader_id)
);
