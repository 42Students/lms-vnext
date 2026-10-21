-- V216: team conversations, asks, decisions
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Team module V1 (docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md). Team threads become conversations of five kinds: EVERYONE (one
-- per college), DRIVE / COMPANY / STUDENT (one per thing, about_key = job id / company name in lower case / learner id) and TOPIC
-- (free, may be private). Messages can be asks (one person, a "by" date) and decisions; @mentions are kept; bell items can be for
-- one person; a team member can be away.

ALTER TABLE tpo_team_thread
  ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'TOPIC' COMMENT 'EVERYONE | DRIVE | COMPANY | STUDENT | TOPIC',
  ADD COLUMN about_key VARCHAR(200) NULL COMMENT 'DRIVE: job id; COMPANY: company name, trimmed, lower case; STUDENT: learner id; EVERYONE: everyone',
  ADD COLUMN is_private TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'TOPIC only: just its members can read it',
  ADD COLUMN archived_at DATETIME NULL,
  ADD UNIQUE KEY uk_tpo_team_thread_about (college_id, kind, about_key);

ALTER TABLE tpo_team_thread_member
  ADD COLUMN following TINYINT(1) NULL DEFAULT NULL COMMENT '1 follows, 0 stopped following, NULL = the default rules (Everyone, owner of the drive or company, member of a private topic)',
  ADD COLUMN muted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN joined_reason VARCHAR(12) NULL COMMENT 'STARTED | WROTE | MENTIONED | PICKED | FOLLOWED | ASKED | OPENED';

ALTER TABLE tpo_team_message
  ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'MESSAGE' COMMENT 'MESSAGE | SYSTEM',
  ADD COLUMN edited_at DATETIME NULL,
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN is_decision TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN decided_by INT NULL,
  ADD COLUMN decided_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS tpo_team_ask (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  thread_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  assignee_faculty_id INT NOT NULL,
  asked_by_faculty_id INT NOT NULL,
  due_at DATETIME NULL COMMENT 'UTC',
  done_at DATETIME NULL,
  done_by INT NULL,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tpo_team_ask_message (message_id),
  KEY idx_tpo_team_ask_assignee (college_id, assignee_faculty_id, done_at, cancelled_at),
  KEY idx_tpo_team_ask_thread (thread_id)
);

CREATE TABLE IF NOT EXISTS tpo_team_mention (
  message_id BIGINT NOT NULL,
  faculty_id INT NOT NULL,
  thread_id BIGINT NOT NULL,
  college_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  seen_at DATETIME NULL,
  PRIMARY KEY (message_id, faculty_id),
  KEY idx_tpo_team_mention_person (college_id, faculty_id, seen_at)
);

CREATE TABLE IF NOT EXISTS tpo_team_away (
  college_id INT NOT NULL,
  faculty_id INT NOT NULL,
  away_until DATE NOT NULL,
  PRIMARY KEY (college_id, faculty_id)
);

ALTER TABLE tpo_bell ADD COLUMN target_faculty_id INT NULL COMMENT 'Null = the whole placement team; else one person (a mention, an ask)';

-- The threads made before this were picked-people threads: they stay readable by their members only.
UPDATE tpo_team_thread SET is_private = 1 WHERE kind = 'TOPIC';
UPDATE tpo_team_thread_member SET following = 1, joined_reason = 'PICKED';

-- Team messages and drive notes were stored HTML-escaped and then escaped again on screen ("&amp;amp;"): store them as typed.
UPDATE tpo_team_message SET body = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(body, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&');
UPDATE tpo_team_thread SET title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&');

-- A drive's internal notes become the drive's Team conversation (one store; the drive page shows it in place).
INSERT INTO tpo_team_thread (college_id, title, created_by_faculty_id, created_at, last_message_at, kind, about_key, is_private)
SELECT n.college_id, LEFT(COALESCE(CONCAT(j.company_name, ' · ', j.job_title), j.job_title, CONCAT('Drive ', n.job_id)), 200),
       MIN(n.author_faculty_id), MIN(n.created_at), MAX(n.created_at), 'DRIVE', CAST(n.job_id AS CHAR), 0
FROM drive_internal_note n LEFT JOIN job j ON j.id = n.job_id
WHERE NOT EXISTS (SELECT 1 FROM tpo_team_thread t WHERE t.college_id = n.college_id AND t.kind = 'DRIVE' AND t.about_key = CAST(n.job_id AS CHAR))
GROUP BY n.college_id, n.job_id, j.company_name, j.job_title;

INSERT INTO tpo_team_message (thread_id, author_faculty_id, body, created_at)
SELECT t.id, n.author_faculty_id,
       REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(n.body, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'), n.created_at
FROM drive_internal_note n JOIN tpo_team_thread t ON t.college_id = n.college_id AND t.kind = 'DRIVE' AND t.about_key = CAST(n.job_id AS CHAR)
ORDER BY n.id;

INSERT IGNORE INTO tpo_team_thread_member (thread_id, faculty_id, following, joined_reason, last_read_at)
SELECT DISTINCT t.id, n.author_faculty_id, 1, 'WROTE', NOW()
FROM drive_internal_note n JOIN tpo_team_thread t ON t.college_id = n.college_id AND t.kind = 'DRIVE' AND t.about_key = CAST(n.job_id AS CHAR);
