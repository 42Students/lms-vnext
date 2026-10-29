-- DB-067 candidate ONLY. Do NOT run against production or add to the Drizzle
-- journal/schema barrel without Chat 1 integration, disposable PostgreSQL
-- replay, and security approval. DB10 outbound tables remain drafts.
--
-- This protects logical claims; it DOES NOT perform external delivery or
-- promise exactly-once delivery across a network boundary. A CLAIMED row
-- whose lease expired is intentionally QUARANTINED, never auto-reclaimed:
-- a provider may already have accepted the request before the worker crashed.
--
-- Application requirements:
-- * Only privileged outbox workers may EXECUTE these functions.
-- * Resolve stale CLAIMED rows via provider idempotency/reconciliation before
--   scheduling another attempt; never resubmit blindly.
-- * Use a separate stable secret-derived global email suppression HMAC.
-- * Never log or return decrypted recipients, invitation URLs, or tokens.
-- * Do not open an HTTP/provider transaction while holding SQL row locks.
-- * Do not use results as send authorization after any intervening delay.
-- The guarded CREATE OR REPLACE functions and REVOKE statements below are
-- idempotent when replayed after the registered DB10 migration.

CREATE OR REPLACE FUNCTION db10_claim_outbound_messages(
  p_worker text,
  p_max_rows integer DEFAULT 25,
  p_lease_seconds integer DEFAULT 60
) RETURNS TABLE(message_id uuid, fence integer, request_digest varchar)
LANGUAGE plpgsql AS $db067_claim$
BEGIN
  IF p_worker IS NULL OR p_worker !~ '^[A-Za-z0-9_.:-]{1,120}$'
     OR p_max_rows IS NULL OR p_max_rows NOT BETWEEN 1 AND 100
     OR p_lease_seconds IS NULL OR p_lease_seconds NOT BETWEEN 5 AND 300 THEN
    RAISE EXCEPTION 'INVALID_OUTBOUND_CLAIM' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  WITH eligible AS (
    SELECT m.id
    FROM outbound_messages AS m
    WHERE m.status IN ('PENDING', 'RETRY')
      -- DB-067: the only audited provider worker is EMAIL-scoped.
      -- Never claim SMS/WHATSAPP messages before their separate DLT,
      -- opt-in and provider-reconciliation contracts are approved.
      AND m.channel = 'EMAIL'
      AND m.attempts < 5
      AND m.provider_accepted_at IS NULL
      AND m.provider_message_id IS NULL
      AND (m.not_before IS NULL OR m.not_before <= clock_timestamp())
      AND (m.next_attempt_at IS NULL OR m.next_attempt_at <= clock_timestamp())
      AND (m.expires_at IS NULL OR m.expires_at > clock_timestamp())
    ORDER BY m.created_at, m.id
    LIMIT p_max_rows
    FOR UPDATE OF m SKIP LOCKED
  ), claimed AS (
    UPDATE outbound_messages AS o
       SET status = 'CLAIMED',
           claimed_by = p_worker,
           claim_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds),
           claim_fence = o.claim_fence + 1,
           pre_send_authorized_fence = NULL,
           attempts = o.attempts + 1,
           next_attempt_at = NULL,
           updated_at = clock_timestamp()
      FROM eligible AS e
     WHERE o.id = e.id
    RETURNING o.id, o.claim_fence, o.request_digest
  )
  SELECT c.id, c.claim_fence, c.request_digest FROM claimed AS c;
END;
$db067_claim$;

-- Every worker MUST perform this guard AFTER obtaining a claim and BEFORE
-- calling the provider, using the email-global suppression hash calculated
-- from the DECRYPTED envelope. A missing hash for EMAIL fails CLOSED.
-- Call this as close as possible to provider handoff. There remains a
-- concurrency window between the committed check and the network call.
CREATE OR REPLACE FUNCTION db10_check_outbound_pre_send(
  p_message_id uuid,
  p_worker text,
  p_fence integer,
  p_global_email_hash text
) RETURNS boolean
LANGUAGE plpgsql AS $db067_presend$
DECLARE
  v_row outbound_messages%ROWTYPE;
  v_suppressed boolean;
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_row
    FROM outbound_messages
   WHERE id = p_message_id
   FOR UPDATE;
  IF NOT FOUND OR v_row.status <> 'CLAIMED'
     OR v_row.claimed_by IS DISTINCT FROM p_worker
     OR v_row.claim_fence IS DISTINCT FROM p_fence
     OR v_row.claim_expires_at IS NULL
     OR v_row.claim_expires_at <= v_now THEN
    RETURN false;
  END IF;
  IF v_row.channel = 'EMAIL' AND
      (p_global_email_hash IS NULL OR
       p_global_email_hash !~ '^[0-9a-f]{64}$') THEN
    -- Do not mutate the claim on missing/malformed suppression evidence.
    -- The worker must abort; it must not fall back to tenant-scoped hash.
    RAISE EXCEPTION 'GLOBAL_EMAIL_SUPPRESSION_HASH_REQUIRED'
      USING ERRCODE = '22023';
  END IF;
  IF v_row.channel <> 'EMAIL' AND p_global_email_hash IS NOT NULL THEN
    RAISE EXCEPTION 'UNEXPECTED_GLOBAL_EMAIL_HASH'
      USING ERRCODE = '22023';
  END IF;
  -- The worker-supplied HMAC must belong to this exact recipient. Accepting
  -- any syntactically valid digest would bypass another college's EMAIL opt-out.
  -- The outbox stores only a per-message SHA-256 commitment, never the globally
  -- correlatable EMAIL HMAC or plaintext recipient.
  IF v_row.channel = 'EMAIL' AND
     v_row.global_email_hash_commitment IS DISTINCT FROM
       encode(sha256(convert_to(
         'db10-global-email-binding-v1:' || v_row.id::text || ':' || p_global_email_hash,
         'UTF8')), 'hex') THEN
    RAISE EXCEPTION 'GLOBAL_EMAIL_HASH_MISMATCH'
      USING ERRCODE = '22023';
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at <= v_now THEN
    UPDATE outbound_messages
       SET status = 'EXPIRED',
           claimed_by = NULL,
           claim_expires_at = NULL,
           pre_send_authorized_fence = NULL,
           last_safe_failure_code = 'EXPIRED_PRE_SEND',
           updated_at = v_now
     WHERE id = v_row.id;
    RETURN false;
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM outbound_suppressions s
     WHERE s.organization_id = v_row.organization_id
       AND s.channel = v_row.channel
       AND s.recipient_hash = v_row.recipient_hash
       AND s.cleared_at IS NULL
  ) OR (
    v_row.channel = 'EMAIL' AND EXISTS(
      SELECT 1 FROM outbound_global_email_suppressions g
       WHERE g.recipient_hash = p_global_email_hash
         AND g.cleared_at IS NULL
    )
  ) INTO v_suppressed;
  IF v_suppressed THEN
    UPDATE outbound_messages
       SET status = 'SUPPRESSED',
           claimed_by = NULL,
           claim_expires_at = NULL,
           pre_send_authorized_fence = NULL,
           last_safe_failure_code = 'SUPPRESSED_PRE_SEND',
           updated_at = v_now
     WHERE id = v_row.id;
    RETURN false;
  END IF;
  -- Completion MUST be impossible unless this exact claim passed the
  -- global/local suppression, deadline and recipient-binding checks.
  UPDATE outbound_messages
     SET pre_send_authorized_fence = p_fence, updated_at = v_now
   WHERE id = v_row.id;
  RETURN true;
END;
$db067_presend$;

-- Complete a claim only with its exact fence and a LIVE lease.
-- RETRY is for a DEFINITELY UNSENT provider rejection; unknown/timeout
-- provider outcomes must remain CLAIMED pending human/provider reconciliation.
-- A provider-accepted message is never put back on the dispatch queue.
CREATE OR REPLACE FUNCTION db10_complete_outbound_claim(
  p_message_id uuid,
  p_worker text,
  p_fence integer,
  p_outcome text,
  p_provider_message_id text DEFAULT NULL,
  p_safe_failure_code text DEFAULT NULL,
  p_next_attempt_at timestamptz DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql AS $db067_complete$
DECLARE
  v_row outbound_messages%ROWTYPE;
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_row FROM outbound_messages
   WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND OR v_row.status <> 'CLAIMED'
     OR v_row.claimed_by IS DISTINCT FROM p_worker
     OR v_row.claim_fence IS DISTINCT FROM p_fence
     OR v_row.claim_expires_at IS NULL
     OR v_row.claim_expires_at <= v_now
     OR v_row.pre_send_authorized_fence IS DISTINCT FROM p_fence THEN
    RETURN false;
  END IF;
  IF p_outcome = 'PROVIDER_ACCEPTED' THEN
    IF p_provider_message_id IS NULL
       OR length(trim(p_provider_message_id)) NOT BETWEEN 1 AND 200
       OR p_safe_failure_code IS NOT NULL
       OR p_next_attempt_at IS NOT NULL THEN
      RAISE EXCEPTION 'INVALID_ACCEPTANCE_RESULT' USING ERRCODE = '22023';
    END IF;
    UPDATE outbound_messages
       SET status = 'PROVIDER_ACCEPTED',
           provider_message_id = p_provider_message_id,
           provider_accepted_at = v_now,
           claimed_by = NULL,
           claim_expires_at = NULL,
           pre_send_authorized_fence = NULL,
           last_safe_failure_code = NULL,
           updated_at = v_now
     WHERE id = v_row.id;
    RETURN true;
  ELSIF p_outcome IN ('RETRY', 'FAILED') THEN
    IF p_provider_message_id IS NOT NULL
       OR p_safe_failure_code IS NULL
       OR p_safe_failure_code !~ '^[A-Z0-9_]{1,40}$'
       OR (p_outcome = 'RETRY' AND
         (v_row.attempts >= 5 OR p_next_attempt_at IS NULL OR
          p_next_attempt_at <= v_now OR
          (v_row.expires_at IS NOT NULL AND p_next_attempt_at >= v_row.expires_at)))
       OR (p_outcome = 'FAILED' AND p_next_attempt_at IS NOT NULL) THEN
      RAISE EXCEPTION 'INVALID_FAILURE_RESULT' USING ERRCODE = '22023';
    END IF;
    UPDATE outbound_messages
       SET status = p_outcome,
           claimed_by = NULL,
           claim_expires_at = NULL,
           pre_send_authorized_fence = NULL,
           next_attempt_at = CASE WHEN p_outcome = 'RETRY'
                                  THEN p_next_attempt_at ELSE NULL END,
           last_safe_failure_code = p_safe_failure_code,
           updated_at = v_now
     WHERE id = v_row.id;
    RETURN true;
  END IF;
  RAISE EXCEPTION 'INVALID_OUTCOME' USING ERRCODE = '22023';
END;
$db067_complete$;

-- Expiration is permitted only for UNSENT, UNCLAIMED rows. Never
-- turn an ambiguous timed-out CLAIMED row back into a dispatchable row.
CREATE OR REPLACE FUNCTION db10_expire_unclaimed_outbound(
  p_max_rows integer DEFAULT 100
) RETURNS integer
LANGUAGE plpgsql AS $db067_expire$
DECLARE v_count integer;
BEGIN
  IF p_max_rows IS NULL OR p_max_rows NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'INVALID_EXPIRY_BATCH' USING ERRCODE = '22023';
  END IF;
  WITH eligible AS (
    SELECT m.id FROM outbound_messages m
     WHERE m.status IN ('PENDING', 'RETRY')
       AND m.expires_at <= clock_timestamp()
     ORDER BY m.expires_at, m.id
     LIMIT p_max_rows FOR UPDATE OF m SKIP LOCKED
  ), changed AS (
    UPDATE outbound_messages o SET status = 'EXPIRED',
      next_attempt_at = NULL, updated_at = clock_timestamp()
      FROM eligible e WHERE o.id = e.id RETURNING o.id
  )
  SELECT count(*)::integer INTO v_count FROM changed;
  RETURN v_count;
END;
$db067_expire$;

-- PostgreSQL grants EXECUTE on newly created functions to PUBLIC by default.
-- Fail closed NOW in this candidate, not merely in a future migration note.
-- W01 must grant EXECUTE only to a dedicated trusted dispatcher DB principal,
-- with NO guest, web-request, tenant-user, or general app role EXECUTE.
REVOKE ALL ON FUNCTION db10_claim_outbound_messages(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION db10_check_outbound_pre_send(uuid, text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION db10_complete_outbound_claim(uuid, text, integer, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION db10_expire_unclaimed_outbound(integer) FROM PUBLIC;

-- Do not turn this draft into exposed RPC.
-- Acceptance: two simultaneous claimers; no stale fence; suppressed after
-- enqueue; global EMAIL opt-out; expiry; unknown provider outcome quarantine;
-- provider accepted cannot reenter retry; fail-closed incorrect HMAC.
