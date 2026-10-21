-- Turns the known-errors table into a triage memory: for each error signature, what we decided
-- about it (open / fixed in commit X / expected), why it was muted, which tracker issue covers it,
-- which release last produced it, and whether a "fixed" error came back (regression).
ALTER TABLE log_alert_signature
    ADD COLUMN fix_status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    ADD COLUMN fixed_in_commit VARCHAR(64) NULL,
    ADD COLUMN fixed_at TIMESTAMP NULL,
    ADD COLUMN status_note VARCHAR(500) NULL,
    ADD COLUMN muted_reason VARCHAR(255) NULL,
    ADD COLUMN issue_public_id VARCHAR(32) NULL,
    ADD COLUMN last_seen_commit VARCHAR(64) NULL,
    ADD COLUMN regressed_at TIMESTAMP NULL,
    ADD COLUMN sample_path VARCHAR(255) NULL;
