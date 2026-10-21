-- V219: audit findings tracker (/tracker/audit-findings)
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Findings arrive as JSON files in the 42Students/lms-findings repo (inbox/), written by people and AI agents; the
-- backend imports them (AuditFindingSyncService). People then triage them here. Design: docs/audit-findings/DESIGN.md.

-- One row per finding: what the reporter wrote (never changed after import) and its current state (changed only through
-- audit_finding_event, which keeps the whole history).
CREATE TABLE IF NOT EXISTS audit_finding (
  id VARCHAR(80) NOT NULL PRIMARY KEY COMMENT 'The finding id from its file, e.g. 2026-10-13-login-k7f3',
  title VARCHAR(200) NOT NULL,
  area VARCHAR(40) NOT NULL,
  roles VARCHAR(200) NOT NULL COMMENT 'Comma-separated roles affected',
  reported_severity VARCHAR(16) NOT NULL COMMENT 'Severity the reporter suggested',
  severity VARCHAR(16) NOT NULL COMMENT 'Current severity (a person may change it)',
  kind VARCHAR(20) NOT NULL,
  environment VARCHAR(10) NOT NULL,
  where_json JSON NOT NULL,
  summary TEXT NOT NULL,
  steps_json JSON NULL,
  expected TEXT NULL,
  actual TEXT NULL,
  evidence TEXT NULL,
  suggested_fix TEXT NULL,
  found_by_agent VARCHAR(60) NOT NULL,
  found_by_session VARCHAR(300) NULL,
  found_at DATETIME NOT NULL COMMENT 'UTC',
  related_json JSON NULL,
  duplicate_of VARCHAR(80) NULL COMMENT 'Set by the reporter or a person',
  status VARCHAR(20) NOT NULL DEFAULT 'new' COMMENT 'new, confirmed, in_progress, fixed, released, verified, duplicate, wont_fix, needs_info, cannot_reproduce',
  assignee VARCHAR(100) NULL,
  fix_commits_json JSON NULL COMMENT 'All commits linked as fixes, [{repo, sha}]',
  source_file VARCHAR(200) NOT NULL,
  source_commit VARCHAR(40) NOT NULL,
  imported_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_audit_finding_status (status),
  KEY idx_audit_finding_area (area),
  KEY idx_audit_finding_severity (severity),
  KEY idx_audit_finding_found_at (found_at)
);

-- Everything that ever happened to a finding, oldest first: the import, agents' update files, and every change a person
-- made on the page. Rows are only ever added.
CREATE TABLE IF NOT EXISTS audit_finding_event (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  finding_id VARCHAR(80) NOT NULL,
  event_type VARCHAR(30) NOT NULL COMMENT 'imported, agent_update, status, severity, assignee, comment, commit, duplicate, retest',
  from_value VARCHAR(200) NULL,
  to_value VARCHAR(200) NULL,
  note TEXT NULL,
  commits_json JSON NULL,
  actor VARCHAR(100) NOT NULL COMMENT 'Agent name (from a file) or the person who acted',
  actor_kind VARCHAR(10) NOT NULL COMMENT 'AGENT or PERSON',
  source_file VARCHAR(200) NULL,
  created_at DATETIME NOT NULL,
  KEY idx_audit_finding_event_finding (finding_id, id)
);

-- Every inbox file the importer has seen, with its content hash: a file already imported that later changes or
-- disappears is reported, never silently re-imported. Rejected files are kept with the reasons.
CREATE TABLE IF NOT EXISTS audit_finding_file (
  path VARCHAR(200) NOT NULL PRIMARY KEY,
  blob_sha VARCHAR(40) NOT NULL COMMENT 'Git blob hash of the content imported (or rejected)',
  commit_sha VARCHAR(40) NOT NULL,
  result VARCHAR(12) NOT NULL COMMENT 'IMPORTED, REJECTED, TAMPERED, DELETED',
  errors TEXT NULL,
  record_id VARCHAR(120) NULL,
  first_seen_at DATETIME NOT NULL,
  last_checked_at DATETIME NOT NULL,
  KEY idx_audit_finding_file_result (result)
);

-- The importer's one row of state.
CREATE TABLE IF NOT EXISTS audit_finding_sync (
  id TINYINT NOT NULL PRIMARY KEY,
  last_commit VARCHAR(40) NULL,
  last_run_at DATETIME NULL,
  last_success_at DATETIME NULL,
  last_result VARCHAR(400) NULL,
  last_error VARCHAR(1000) NULL
);
INSERT IGNORE INTO audit_finding_sync (id) VALUES (1);
