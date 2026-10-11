-- DB-004 / Chat 2. SOURCE-BACKED DESIGN CANDIDATE ONLY.
-- NOT A REGISTERED MIGRATION. DO NOT APPLY TO LIVE DATABASES.
-- Chat 1 exclusively integrates numbered Drizzle migrations/schema barrel.
--
-- Legacy AppSettingsService:
-- otp.maxAttempts default=5; otp.windowSeconds default=900;
-- ops.identityMaxJsonSize default=10000. All global.
--
-- Intentionally NOT storing baseDomain/globalHost/cookieDomain/cookieSameSite:
-- proposed deployment configuration, never general client settings.
-- Admin runtime-editability versus deployment-only config is an OPEN
-- parity/design choice; API/UI may not advertise dynamic edits yet.
--
-- Minimal singleton typed policy prevents arbitrary-key cross-domain settings.
-- Do not stage if managed Identity Platform is proven to own every OTP
-- throttle end-to-end; preserve exact user-job/provider acceptance evidence.

CREATE TABLE identity_global_security_policy (
  singleton_key varchar(6) PRIMARY KEY DEFAULT 'GLOBAL',
  otp_max_attempts integer NOT NULL DEFAULT 5,
  otp_window_seconds integer NOT NULL DEFAULT 900,
  identity_max_json_size integer NOT NULL DEFAULT 10000,
  policy_version bigint NOT NULL DEFAULT 1,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identity_global_security_policy_singleton_ck
    CHECK (singleton_key = 'GLOBAL'),
  CONSTRAINT identity_global_security_policy_otp_max_ck
    CHECK (otp_max_attempts BETWEEN 1 AND 5),
  CONSTRAINT identity_global_security_policy_otp_window_ck
    CHECK (otp_window_seconds BETWEEN 60 AND 3600),
  CONSTRAINT identity_global_security_policy_json_max_ck
    CHECK (identity_max_json_size BETWEEN 1024 AND 131072),
  CONSTRAINT identity_global_security_policy_version_ck
    CHECK (policy_version >= 1)
);

-- Singleton read: if no row exists, use the three legacy-matched defaults.
-- Atomic policy edit (shape only, not application code):
-- UPDATE identity_global_security_policy
-- SET otp_max_attempts = $1, otp_window_seconds = $2,
--     identity_max_json_size = $3,
--     policy_version = policy_version + 1,
--     updated_by_user_id = $4, updated_at = now()
-- WHERE singleton_key = 'GLOBAL' AND policy_version = $5
-- RETURNING policy_version;
--
-- Caution: the separately staged identity_auth_attempts table has a hard
-- verification_attempts BETWEEN 0 AND 5 constraint. Every OTP attempt
-- reservation must atomically enforce < least(otp_max_attempts, 5).
-- Never use SELECT and a later unguarded UPDATE; concurrent requests can
-- otherwise exceed the configured limit. A failed policy lookup must fail
-- closed or use explicitly approved safe defaults, never unlimited retries.
--
-- Acceptance prerequisites:
-- 1. Confirm settings source jobs and managed-provider substitution.
-- 2. Approve product decision on global-only runtime overrides.
-- 3. Verify actor authorization; server-only visibility; audit edits.
-- 4. Non-root policy role cannot DDL/INSERT duplicate singleton;
--    INSERT/UPDATE out-of-bounds fails with SQLSTATE 23514.
-- 5. Concurrent policy CAS allows one winner for the same version.
-- 6. Concurrent OTP failure counter <= configured bound, <= 5.
-- 7. No raw OTPs, passwords, provider cookies or bearer tokens persist.
-- 8. Chat 1 registers via Drizzle and runs disposable PostgreSQL replay.
