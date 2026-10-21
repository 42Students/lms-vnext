-- Backs the Logs-page alerting work: tells "an error type we've never seen before" apart from
-- "the same known error happening again" (so a Telegram alert can say which), and persists both
-- the alerting poller's own scan cursor and the admin's last-viewed timestamp so a pod restart or
-- a browser refresh doesn't lose either.

CREATE TABLE log_alert_signature (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    environment VARCHAR(32) NOT NULL,
    signature_hash CHAR(64) NOT NULL,
    sample_message VARCHAR(500) NULL,
    first_seen_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    occurrence_count BIGINT NOT NULL DEFAULT 1,
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uq_log_alert_signature (environment, signature_hash)
);

CREATE TABLE log_alert_state (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    state_key VARCHAR(64) NOT NULL,
    poll_cursor_at TIMESTAMP NULL,
    admin_last_viewed_at TIMESTAMP NULL,
    UNIQUE KEY uq_log_alert_state_key (state_key)
);
