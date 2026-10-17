-- PROPOSAL ONLY. Orchestrator owns migration numbering, replay and schema export.
-- Include full DB10 signature/state/lease definitions for first registration.
CREATE TABLE IF NOT EXISTS log_alert_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment varchar(32) NOT NULL,
  signature_hash varchar(64) NOT NULL CHECK (signature_hash ~ '^[0-9a-f]{64}$'),
  sample_message varchar(500), first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  occurrence_count bigint NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  muted boolean NOT NULL DEFAULT false,
  fix_status varchar(16) NOT NULL DEFAULT 'OPEN' CHECK (fix_status IN ('OPEN','FIXED','EXPECTED')),
  fixed_in_commit varchar(64), fixed_at timestamptz, status_note varchar(500),
  muted_reason varchar(255), issue_public_id varchar(32), last_seen_commit varchar(64),
  regressed_at timestamptz, sample_path varchar(255),
  alerted_at timestamptz, acknowledged_at timestamptz,
  last_spike_alert_at timestamptz, recent_window_at timestamptz,
  recent_window_count bigint NOT NULL DEFAULT 1,
  day_key varchar(10), day_occurrences bigint NOT NULL DEFAULT 1,
  CONSTRAINT db10_log_alert_signature_env_hash_uq UNIQUE (environment, signature_hash),
  CONSTRAINT db10_log_alert_signature_seen_order_ck CHECK (last_seen_at >= first_seen_at),
  CONSTRAINT db10_log_alert_signature_fixed_shape_ck CHECK (fix_status <> 'FIXED' OR fixed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_status_seen_idx ON log_alert_signatures (fix_status, last_seen_at);
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_muted_seen_idx ON log_alert_signatures (muted, last_seen_at);
CREATE TABLE IF NOT EXISTS log_alert_signature_accounts (
  signature_id uuid NOT NULL REFERENCES log_alert_signatures(id) ON DELETE CASCADE,
  account_key_hash varchar(64) NOT NULL CHECK (account_key_hash ~ '^[0-9a-f]{64}$'),
  first_seen_at timestamptz NOT NULL, PRIMARY KEY (signature_id, account_key_hash)
);
CREATE INDEX IF NOT EXISTS db10_log_alert_signature_accounts_hash_idx
  ON log_alert_signature_accounts (account_key_hash, first_seen_at);
CREATE TABLE IF NOT EXISTS log_alert_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key varchar(64) NOT NULL UNIQUE CHECK (length(trim(state_key)) > 0),
  poll_cursor_at timestamptz, admin_last_viewed_at timestamptz,
  burst_minute_at timestamptz, burst_count bigint NOT NULL DEFAULT 0,
  overflow_count bigint NOT NULL DEFAULT 0, last_digest_day varchar(10)
);
CREATE TABLE IF NOT EXISTS scheduled_job_leases (
  job_name varchar(120) PRIMARY KEY,
  locked_until timestamptz NOT NULL, locked_by varchar(120) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  fence bigint NOT NULL DEFAULT 1 CHECK (fence > 0)
);
-- REQUIRED before deployment: registered SQL replay and DB10_LOG_ALERTS_READY=DB10_VERIFIED.

-- 09:00 IST digest must not lose yesterday's counts when a signature recurs today.
CREATE TABLE IF NOT EXISTS log_alert_daily_counts (
  signature_id uuid NOT NULL REFERENCES log_alert_signatures(id) ON DELETE CASCADE,
  day_key varchar(10) NOT NULL,
  occurrence_count bigint NOT NULL DEFAULT 1 CHECK (occurrence_count >= 1),
  spike_count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (signature_id, day_key)
);
CREATE INDEX IF NOT EXISTS db10_log_alert_daily_day_idx ON log_alert_daily_counts (day_key);

-- If W01 registered the original DB10 draft before this proposal, do not rely
-- on CREATE TABLE IF NOT EXISTS to add newly introduced telemetry columns.
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS alerted_at timestamptz;
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS last_spike_alert_at timestamptz;
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS recent_window_at timestamptz;
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS recent_window_count bigint NOT NULL DEFAULT 1;
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS day_key varchar(10);
ALTER TABLE log_alert_signatures ADD COLUMN IF NOT EXISTS day_occurrences bigint NOT NULL DEFAULT 1;
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS burst_minute_at timestamptz;
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS burst_count bigint NOT NULL DEFAULT 0;
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS overflow_count bigint NOT NULL DEFAULT 0;
ALTER TABLE log_alert_states ADD COLUMN IF NOT EXISTS last_digest_day varchar(10);

-- A request seen by logError and the Cloud Logging fallback must count once.
-- Store only SHA-256 event identifiers (environment/signature/opaque request id).
CREATE TABLE IF NOT EXISTS log_alert_observed_events (
  event_hash varchar(64) PRIMARY KEY CHECK (event_hash ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS db10_log_alert_observed_at_idx
  ON log_alert_observed_events (observed_at);
