-- DB-004 / Chat 2. STAGING ONLY — DO NOT APPLY DIRECTLY.
-- Chat 1 owns registered Drizzle migration + snapshot/schema-barrel integration.
-- This is a greenfield vNext-only session-security proposal; it neither
-- backfills legacy records nor stores legacy raw refresh token values.

CREATE TABLE identity_device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  credential_digest varchar(64) NOT NULL,
  device_name varchar(255),
  user_agent varchar(512),
  ip_address varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason text,
  CONSTRAINT identity_device_sessions_digest_format_ck
    CHECK (credential_digest ~ '^[0-9a-f]{64}$'),
  CONSTRAINT identity_device_sessions_expiry_ck
    CHECK (expires_at > created_at),
  CONSTRAINT identity_device_sessions_last_seen_ck
    CHECK (last_seen_at >= created_at),
  CONSTRAINT identity_device_sessions_revoked_time_ck
    CHECK (revoked_at IS NULL OR revoked_at >= created_at),
  CONSTRAINT identity_device_sessions_revoker_shape_ck
    CHECK ((revoked_at IS NULL) = (revoked_by_user_id IS NULL))
);
CREATE UNIQUE INDEX identity_device_sessions_digest_uq
  ON identity_device_sessions (credential_digest);
CREATE INDEX identity_device_sessions_user_time_idx
  ON identity_device_sessions (user_id, last_seen_at);
CREATE INDEX identity_device_sessions_expiry_idx
  ON identity_device_sessions (expires_at);

-- Candidate product contract (requires platform design approval):
-- * A keyed HMAC-SHA256 digest of the Firebase session cookie binds a session
--   to this row. Never store/echo raw cookies, access or refresh tokens.
-- * Every authenticated request must check the corresponding row is not
--   revoked/expired, in addition to Firebase's own verification. A row that
--   cannot be found must FAIL CLOSED after migration rollout is enabled.
-- * Session revocation uses a SELECT ... FOR UPDATE against the owner row and
--   persisted CURRENT actor + policy check. Only owner or explicitly privileged
--   central admin, never a faculty role merely by user_type, can revoke.
-- * Retain only minimum device/IP metadata required by accepted product UX;
--   implement bounded retention, user transparency, IP-redaction policy, and
--   avoid credentials in observability/analytics logs.
-- * Session startup must be atomic with durable session-row recording or
--   fail closed; don't mint a usable cookie if its DB audit record is missing.
-- * Separate global provider token revocation from single-device revocation;
--   preserve all-sessions logout and targeted revocation as distinct jobs.
--
-- Acceptance after promotion: clean journal replay, fake JWT injection
-- rejection, replay/one-device revocation, cross-account and role denial,
-- simultaneous logout/use, expiry and retention sweeps.
