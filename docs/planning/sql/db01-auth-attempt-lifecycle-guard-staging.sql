-- Chat 2 / DB-004 / 2026-10-11
-- STAGED ONLY: unregistered companion to db01-auth-attempts-staging.sql.
-- Only if Chat 1 approves database-backed OTP (provider-only remains allowed).
-- This is a proof candidate for DB01 retry/expiry/consume immutability, not
-- a second authentication provider and not a replacement for rate limiting.
-- No existing-data UPDATE/DELETE; do not apply directly to real databases.
--
-- Existing row CHECK constraints cannot inspect the OLD state, thus a value
-- between 0..5 may still be reset from 5 to 0 or challenge expiry extended.
-- These invariants require a row-transition guard within the same UPDATE.

CREATE OR REPLACE FUNCTION db01_auth_attempt_monotonic_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Challenge identity, scope, role, contact, and creation timestamp are
  -- immutable. Never rebind already-issued OTPs to another actor/college.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     OR NEW.target_role IS DISTINCT FROM OLD.target_role
     OR NEW.contact_fingerprint IS DISTINCT FROM OLD.contact_fingerprint
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Auth attempt identity/scope cannot change'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_scope_immutable_ck';
  END IF;

  -- One verification or resend reservation per atomic UPDATE. Counts may
  -- only advance. This blocks resetting exhausted attempts to zero.
  IF NEW.verification_attempts < OLD.verification_attempts
     OR NEW.verification_attempts > OLD.verification_attempts + 1
     OR NEW.resend_attempts < OLD.resend_attempts
     OR NEW.resend_attempts > OLD.resend_attempts + 1 THEN
    RAISE EXCEPTION 'Auth attempt retry counters must be monotonic'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_counters_monotonic_ck';
  END IF;

  -- Version is the optimistic state epoch. All state updates must advance
  -- it exactly once; otherwise an out-of-order code send may hide races.
  IF NEW.version <> OLD.version + 1 THEN
    RAISE EXCEPTION 'Auth attempt update requires next version'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_version_step_ck';
  END IF;

  -- Shortening expiry for explicit invalidation is permitted. Extending
  -- an issued challenge beyond its original expiry is prohibited.
  IF NEW.expires_at > OLD.expires_at THEN
    RAISE EXCEPTION 'Auth attempt expiry cannot be extended'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_expiry_monotonic_ck';
  END IF;

  IF (OLD.verified_at IS NOT NULL
      AND NEW.verified_at IS DISTINCT FROM OLD.verified_at)
     OR (OLD.used_at IS NOT NULL
      AND NEW.used_at IS DISTINCT FROM OLD.used_at) THEN
    RAISE EXCEPTION 'Verified or consumed state cannot be reset'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_terminal_monotonic_ck';
  END IF;

  -- After verification, code material may be CLEARED only, never rotated
  -- to a new non-NULL MAC on this same verified challenge.
  IF OLD.verified_at IS NOT NULL
     AND (
       (NEW.sms_code_mac IS NOT NULL
        AND NEW.sms_code_mac IS DISTINCT FROM OLD.sms_code_mac)
       OR
       (NEW.email_code_mac IS NOT NULL
        AND NEW.email_code_mac IS DISTINCT FROM OLD.email_code_mac)
     ) THEN
    RAISE EXCEPTION 'Verified challenge may not rotate OTP code MAC'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_verified_mac_immutable_ck';
  END IF;

  -- A used challenge is terminal. Its lifecycle metadata and code material
  -- must never change; separate retention DELETE is a product-policy job.
  IF OLD.used_at IS NOT NULL
     AND (
       NEW.sms_code_mac IS DISTINCT FROM OLD.sms_code_mac
       OR NEW.email_code_mac IS DISTINCT FROM OLD.email_code_mac
       OR NEW.sms_code_expires_at IS DISTINCT FROM OLD.sms_code_expires_at
       OR NEW.email_code_expires_at IS DISTINCT FROM OLD.email_code_expires_at
       OR NEW.email_code_sent_at IS DISTINCT FROM OLD.email_code_sent_at
       OR NEW.verification_attempts IS DISTINCT FROM OLD.verification_attempts
       OR NEW.resend_attempts IS DISTINCT FROM OLD.resend_attempts
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     ) THEN
    RAISE EXCEPTION 'Consumed auth attempt is immutable'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_auth_attempt_consumed_immutable_ck';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_auth_attempt_monotonic_trg
BEFORE UPDATE ON identity_auth_attempts
FOR EACH ROW
EXECUTE FUNCTION db01_auth_attempt_monotonic_guard();

-- REQUIRED BEFORE MIGRATION PROMOTION:
-- * Provider-only possibility + email-first flow must be decided explicitly.
-- * Integrating services must increment version exactly once on EVERY
--   state change, including atomic verify reservation and email send/resend.
-- * A used row must mark verified_at <= used_at, clear BOTH SMS/email MACs,
--   and clear both corresponding code-expiry columns in the same UPDATE.
-- * The row CHECK additionally bounds total expires_at to created_at + 5m;
--   verify current source-backed auth semantics and clock tolerance.
-- * Challenge exhaustion is PER ATTEMPT. New-attempt contact/IP rate limits,
--   HMAC pepper rotation and provider verification remain separate gates.
-- * Two-session races: simultaneous increment from 4 may have one winner
--   and the other must see 5 and fail under the conditional reservation.
-- * Test direct SQL counter reset, expiry extension, consume reversion,
--   scope switch, MAC swap after verified, version replay, and stale
--   resend/verify attempt. The database can protect state integrity, not
--   prove the caller knows the OTP or is authenticated.
-- * Execute against independently disposable PostgreSQL, generated Drizzle
--   journal replay, and real API lifecycle before treating this as done.
