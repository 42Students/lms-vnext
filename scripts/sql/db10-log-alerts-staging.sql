-- DB-023 DB10 log-alert durable triage — STAGING ONLY / NOT REGISTERED.
-- Oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- V157__log_alerting.sql, V158__log_alert_signature_accounts.sql,
-- V164__log_alert_signature_triage.sql and LogAlertingService.
-- Only Chat 1 may journal this migration and register the Drizzle schema.
-- Raw cloud logs are NOT stored here; these tables hold bounded triage memory.
CREATE TABLE IF NOT EXISTS log_alert_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment varchar(32) NOT NULL,
  signature_hash varchar(64) NOT NULL,
  sample_message varchar(500),
  first_seen_at timestamp with time zone NOT NULL,
  last_seen_at timestamp with time zone NOT NULL,
  occurrence_count bigint NOT NULL DEFAULT 1,
  muted boolean NOT NULL DEFAULT false,
  fix_status varchar(16) NOT NULL DEFAULT 'OPEN',
  fixed_in_commit varchar(64),
  fixed_at timestamp with time zone,
  status_note varchar(500),
  muted_reason varchar(255),
  issue_public_id varchar(32),
  last_seen_commit varchar(64),
  regressed_at timestamp with time zone,
  sample_path varchar(255),
  alerted_at timestamp with time zone,
  acknowledged_at timestamp with time zone,
  last_spike_alert_at timestamp with time zone,
  recent_window_at timestamp with time zone,
  recent_window_count bigint NOT NULL DEFAULT 1,
  day_key varchar(10),
  day_occurrences bigint NOT NULL DEFAULT 1,
  CONSTRAINT db10_log_alert_signature_hash_ck
    CHECK (signature_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT db10_log_alert_signature_count_ck
    CHECK (occurrence_count >= 1),
  CONSTRAINT db10_log_alert_signature_status_ck
    CHECK (fix_status IN ('OPEN','FIXED','EXPECTED')),
  CONSTRAINT db10_log_alert_signature_seen_order_ck
    CHECK (last_seen_at >= first_seen_at),
  CONSTRAINT db10_log_alert_signature_fixed_shape_ck
    CHECK ((fix_status = 'FIXED' AND fixed_at IS NOT NULL) OR fix_status <> 'FIXED')
);
CREATE UNIQUE INDEX IF NOT EXISTS db10_log_alert_signature_env_hash_uq
  ON log_alert_signatures(environment,signature_hash);
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_status_seen_idx
  ON log_alert_signatures(fix_status,last_seen_at);
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_muted_seen_idx
  ON log_alert_signatures(muted,last_seen_at);

-- Source V158 account_id is a typed account=<id>/<ROLE> log marker, not
-- a proven global vNext users.id FK. An opaque keyed HMAC of a verified
-- typed identity preserves distinct-account blast radius without raw PII.
-- Untrusted frontend-supplied markers must never produce trusted rows.
CREATE TABLE IF NOT EXISTS log_alert_signature_accounts (
  signature_id uuid NOT NULL REFERENCES log_alert_signatures(id) ON DELETE CASCADE,
  account_key_hash varchar(64) NOT NULL,
  first_seen_at timestamp with time zone NOT NULL,
  PRIMARY KEY (signature_id,account_key_hash),
  CONSTRAINT db10_log_alert_signature_accounts_hash_ck
    CHECK (account_key_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_accounts_hash_idx
  ON log_alert_signature_accounts(account_key_hash,first_seen_at);

CREATE TABLE IF NOT EXISTS log_alert_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key varchar(64) NOT NULL,
  poll_cursor_at timestamp with time zone,
  poll_page_token varchar(1024),
  poll_window_start_at timestamp with time zone,
  poll_window_end_at timestamp with time zone,
  admin_last_viewed_at timestamp with time zone,
  burst_minute_at timestamp with time zone,
  burst_count bigint NOT NULL DEFAULT 0,
  overflow_count bigint NOT NULL DEFAULT 0,
  last_digest_day varchar(10),
  CONSTRAINT db10_log_alert_states_key_ck CHECK (length(btrim(state_key)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS db10_log_alert_states_key_uq ON log_alert_states(state_key);

-- Independent daily and deduplication histories are required by the active
-- reporter/scheduler producer. Without these tables, a staged migration can
-- appear present while the first report or digest fails at runtime.
CREATE TABLE IF NOT EXISTS log_alert_daily_counts (
  signature_id uuid NOT NULL REFERENCES log_alert_signatures(id) ON DELETE CASCADE,
  day_key varchar(10) NOT NULL,
  occurrence_count bigint NOT NULL DEFAULT 1,
  spike_count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (signature_id,day_key),
  CONSTRAINT db10_log_alert_daily_count_ck CHECK (occurrence_count >= 1)
);
CREATE INDEX IF NOT EXISTS db10_log_alert_daily_day_idx
  ON log_alert_daily_counts(day_key);

CREATE TABLE IF NOT EXISTS log_alert_observed_events (
  event_hash varchar(64) PRIMARY KEY,
  observed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT db10_log_alert_observed_hash_ck
    CHECK (event_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX IF NOT EXISTS db10_log_alert_observed_at_idx
  ON log_alert_observed_events(observed_at);

-- The SQL remains STAGING ONLY. The registered journal, catalog, drift and
-- producer authorization witnesses are not certified by this source change.
-- RUNTIME REQUIREMENTS, NOT IMPLEMENTED BY THE SCHEMA:
-- A: per-environment hash upsert must atomically increment the BIGINT counter
--    and use LEAST(first_seen_at,new_time), GREATEST(last_seen_at,new_time)
--    for out-of-order log entries; preserve FIXED/EXPECTED triage decisions.
-- B: regression detection is an atomic, one-time FIXED -> regressed_at stamp
--    conditioned on original fixed_at/commit/grace; no duplicate alert.
-- C: signature/account insert is ON CONFLICT DO NOTHING to maintain exact
--    distinct count; no raw account IDs, untrusted client marker or PII.
-- D: durable cursor CAS and lease/leader ownership prevent multiple pollers
--    from double-counting a scanned log batch after restart.
-- E: sample_message/sample_path MUST be PII-sanitized/redacted upstream;
--    retention and scoped access need a private security policy.
-- F: absence of account identity must yield UNKNOWN (null blast-radius
--    count), never a misleading zero.
--
-- No live migration, producer or PostgreSQL proof is claimed.
