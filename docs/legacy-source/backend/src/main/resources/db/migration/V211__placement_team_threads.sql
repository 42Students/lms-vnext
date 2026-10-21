-- V211: placement team threads
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Phase 2, N13: the placement team messages each other in threads (like People in Projects). A thread has a topic and the
-- team members in it; only they read it. Never shown to recruiters or students.
CREATE TABLE IF NOT EXISTS tpo_team_thread (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  created_by_faculty_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME NULL,
  KEY idx_tpo_team_thread_college (college_id, last_message_at)
);

CREATE TABLE IF NOT EXISTS tpo_team_thread_member (
  thread_id BIGINT NOT NULL,
  faculty_id INT NOT NULL,
  last_read_at DATETIME NULL,
  PRIMARY KEY (thread_id, faculty_id),
  KEY idx_tpo_team_thread_member_faculty (faculty_id)
);

CREATE TABLE IF NOT EXISTS tpo_team_message (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  thread_id BIGINT NOT NULL,
  author_faculty_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tpo_team_message_thread (thread_id, id)
);
