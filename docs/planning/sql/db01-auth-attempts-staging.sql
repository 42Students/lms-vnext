-- DB-004 / Chat 2: source-backed identity_auth_attempts candidate.
-- STAGED ONLY: not in generated migration journal; DO NOT APPLY manually.
-- Chat 1 must review and generate migration/snapshot from the corresponding
-- src/db/schema/db01-auth-attempts.staged.ts once approved.
--
-- Legacy source: MobileLoginAttemptRepository, PublicMobileAuthController
-- @ 42Students/lms/prod-2026 21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- This proposal is NOT permission to build a second OTP engine if Firebase
-- Identity Platform already fulfills all required login/anti-replay contracts.

CREATE TABLE identity_auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  college_id uuid REFERENCES colleges(id) ON DELETE RESTRICT,
  membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  target_role varchar(24) NOT NULL,
  contact_fingerprint varchar(64) NOT NULL,
  sms_code_mac varchar(64),
  sms_code_expires_at timestamptz,
  email_code_mac varchar(64),
  email_code_expires_at timestamptz,
  email_code_sent_at timestamptz,
  verification_attempts integer NOT NULL DEFAULT 0,
  resend_attempts integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  used_at timestamptz,
  CONSTRAINT identity_auth_attempts_membership_college_shape_ck
    CHECK (membership_id IS NULL OR college_id IS NOT NULL),
  CONSTRAINT identity_auth_attempts_expiry_ck CHECK (expires_at > created_at),
  CONSTRAINT identity_auth_attempts_attempt_bounds_ck
    CHECK (verification_attempts BETWEEN 0 AND 5 AND resend_attempts >= 0),
  CONSTRAINT identity_auth_attempts_version_ck CHECK (version >= 1),
  CONSTRAINT identity_auth_attempts_sms_shape_ck
    CHECK ((sms_code_mac IS NULL) = (sms_code_expires_at IS NULL)),
  CONSTRAINT identity_auth_attempts_email_shape_ck
    CHECK ((email_code_mac IS NULL) = (email_code_expires_at IS NULL)),
  CONSTRAINT identity_auth_attempts_mac_shape_ck
    CHECK (
      (sms_code_mac IS NULL OR sms_code_mac ~ '^[0-9a-f]{64}$')
      AND (email_code_mac IS NULL OR email_code_mac ~ '^[0-9a-f]{64}$')
      AND contact_fingerprint ~ '^[0-9a-f]{64}$'
    ),
  CONSTRAINT identity_auth_attempts_timestamp_ck
    CHECK (
      (verified_at IS NULL OR (verified_at >= created_at AND verified_at < expires_at))
      AND (used_at IS NULL OR (used_at >= created_at AND used_at < expires_at))
    ),
  CONSTRAINT identity_auth_attempts_five_minute_expiry_ck
    CHECK (expires_at <= created_at + interval '5 minutes'),
  CONSTRAINT identity_auth_attempts_target_role_shape_ck
    CHECK (char_length(btrim(target_role)) BETWEEN 1 AND 24),
  CONSTRAINT identity_auth_attempts_consumed_shape_ck
    CHECK (
      used_at IS NULL
      OR (
        verified_at IS NOT NULL
        AND verified_at <= used_at
        AND sms_code_mac IS NULL AND sms_code_expires_at IS NULL
        AND email_code_mac IS NULL AND email_code_expires_at IS NULL
      )
    )
);

CREATE INDEX identity_auth_attempts_user_expiry_idx
  ON identity_auth_attempts(user_id, expires_at);
CREATE INDEX identity_auth_attempts_contact_rate_idx
  ON identity_auth_attempts(contact_fingerprint, created_at);
CREATE INDEX identity_auth_attempts_expiry_idx
  ON identity_auth_attempts(expires_at);

-- Expected atomic reservation operation (not implemented in a service):
-- UPDATE identity_auth_attempts
--    SET verification_attempts = verification_attempts + 1,
--        version = version + 1
--  WHERE id = $1 AND used_at IS NULL AND expires_at > now()
--    AND verification_attempts < 5
-- RETURNING id, verification_attempts;
--
-- Validate this operation in actual disposable PostgreSQL under concurrent
-- attempts: 10 racing failures must never reserve more than five slots.
-- A successful login must atomically mark used_at, clear MACs (and expiries),
-- verify actor's current ACTIVE user/membership/college before session issue.
--
-- PII/OTP protections:
-- 1. Only keyed HMAC-SHA256 (pepper stored outside DB) for 6-digit OTPs;
--    SHA-256 of a short OTP without a secret is trivially brute-forceable.
-- 2. Never write raw SMS/email OTP, email address, raw phone, Firebase
--    tokens/cookies, or email fallback code to SQL/logs.
-- 3. Rate limiting uses a separately keyed normalized-contact fingerprint
--    and bounded retention. Per-contact and per-IP abuse policies belong to
--    identity infrastructure; no plaintext contact collection.
-- 4. Verify college_id and membership_id refer to the same college and user.
--    A single FK does NOT enforce this; integrator must add composite FKs or
--    a narrow transaction guard + executed mismatch-negative integration test.
-- 5. Expired/used attempts fail closed; OTP challenge may not be silently
--    replayed even if old legacy flow accepted a brief duplicate replay.
-- 6. Preserve email fallback and recruiter email-first distinct delivery
--    experiences; fake SMS OTP must never validate an email-only challenge.

-- A separate DB01 monotonic-lifecycle trigger proposal is maintained at
-- docs/planning/sql/db01-auth-attempt-lifecycle-guard-staging.sql.
-- Register both together ONLY if Chat 1 has approved database-backed OTP.
-- All shape CHECKs protect direct SQL writes, not provider/session issuance.
