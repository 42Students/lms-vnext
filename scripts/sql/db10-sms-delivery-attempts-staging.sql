-- DB-031 / DB10 generic SMS provider attempt ledger.
-- STAGING ONLY, NOT A DRIZZLE MIGRATION. Chat 1 owns registration.
--
-- Legacy runtime oracle:
--   42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   V134__sms_delivery_log.sql
--   BulkSmsAppsServiceImpl.record(...)
--   ExotelSmsServiceImpl.record(...)
--   AdminSmsLogController
--
-- This is an append-only support/audit ledger, NOT a send queue. It can be
-- populated by OTP, attendance/general notification and job-update SMS paths,
-- including sends that do not originate from the recruiter invitation outbox.
--
-- Privacy rule: persist neither rendered message body nor full phone number.
-- recipient_suffix is last four digits only, matching the source support
-- workflow. Provider acceptance is explicitly NOT handset delivery.

CREATE TABLE sms_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Login OTP can be pre-membership/global. When a producer has tenant context,
  -- persist both and prove their relationship in the trigger below.
  organization_id uuid NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NULL REFERENCES colleges(id) ON DELETE RESTRICT,

  purpose varchar(64) NOT NULL,
  provider varchar(32) NOT NULL,

  -- Deliberately support-safe and collision-prone: only enough for an admin to
  -- answer "was an attempt made to the number ending 4821?"
  recipient_suffix varchar(8) NULL,

  -- Canonicalizes legacy SENT to its truthful meaning.
  outcome varchar(24) NOT NULL,

  provider_message_id varchar(200) NULL,
  safe_failure_code varchar(40) NULL,
  safe_failure_summary varchar(500) NULL,

  -- Optional producer/business correlation. It is not a raw recipient and is
  -- intentionally not an FK because OTP/general SMS can originate outside the
  -- recruiter outbound command model.
  source_event_id uuid NULL,
  attempt_number integer NOT NULL DEFAULT 1,

  provider_accepted_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT db31_sms_attempt_purpose_ck
    CHECK (length(btrim(purpose)) > 0),
  CONSTRAINT db31_sms_attempt_provider_ck
    CHECK (length(btrim(provider)) > 0),
  CONSTRAINT db31_sms_attempt_suffix_ck
    CHECK (recipient_suffix IS NULL OR recipient_suffix ~ '^[0-9]{1,4}$'),
  CONSTRAINT db31_sms_attempt_outcome_ck
    CHECK (outcome IN ('PROVIDER_ACCEPTED','FAILED')),
  CONSTRAINT db31_sms_attempt_number_ck
    CHECK (attempt_number >= 1),
  CONSTRAINT db31_sms_attempt_scope_pair_ck
    CHECK ((organization_id IS NULL) = (college_id IS NULL)),
  CONSTRAINT db31_sms_attempt_failure_code_ck
    CHECK (
      safe_failure_code IS NULL
      OR (
        length(btrim(safe_failure_code)) BETWEEN 1 AND 40
        AND safe_failure_code ~ '^[A-Z0-9_.:-]+$'
      )
    ),
  CONSTRAINT db31_sms_attempt_outcome_shape_ck CHECK (
    (
      outcome = 'PROVIDER_ACCEPTED'
      AND provider_message_id IS NOT NULL
      AND length(btrim(provider_message_id)) > 0
      AND provider_accepted_at IS NOT NULL
      AND safe_failure_code IS NULL
      AND safe_failure_summary IS NULL
    )
    OR
    (
      outcome = 'FAILED'
      AND provider_accepted_at IS NULL
      AND (
        safe_failure_code IS NOT NULL
        OR (safe_failure_summary IS NOT NULL AND length(btrim(safe_failure_summary)) > 0)
      )
    )
  )
);

CREATE INDEX db31_sms_attempt_created_idx
  ON sms_delivery_attempts (created_at DESC);

CREATE INDEX db31_sms_attempt_suffix_purpose_idx
  ON sms_delivery_attempts (recipient_suffix, purpose, created_at DESC);

CREATE INDEX db31_sms_attempt_college_purpose_idx
  ON sms_delivery_attempts (college_id, purpose, created_at DESC)
  WHERE college_id IS NOT NULL;

CREATE INDEX db31_sms_attempt_source_event_idx
  ON sms_delivery_attempts (source_event_id, created_at DESC)
  WHERE source_event_id IS NOT NULL;

-- If tenant context is supplied, never accept a forged organization/college
-- pair. OTP/global rows may legitimately have both columns NULL.
CREATE OR REPLACE FUNCTION db31_guard_sms_attempt_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id IS NOT NULL THEN
    -- A parent SHARE lock serializes this append-only attribution with any
    -- concurrent college organization reassignment until INSERT commits.
    PERFORM 1 FROM colleges c
      WHERE c.id = NEW.college_id
        AND c.organization_id = NEW.organization_id
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'sms delivery attempt tenant scope mismatch'
        USING ERRCODE = '23514',
              CONSTRAINT = 'db31_sms_attempt_tenant_scope';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db31_sms_attempt_scope_guard
BEFORE INSERT ON sms_delivery_attempts
FOR EACH ROW EXECUTE FUNCTION db31_guard_sms_attempt_scope();

-- Support evidence is historical. A correction is a new attempt/event, not an
-- UPDATE that rewrites what the provider returned at the time.
CREATE OR REPLACE FUNCTION db31_block_sms_attempt_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'sms delivery attempts are append-only'
    USING ERRCODE = '55000',
          CONSTRAINT = 'db31_sms_attempt_append_only';
END;
$$;

CREATE TRIGGER db31_sms_attempt_append_only_guard
BEFORE UPDATE OR DELETE ON sms_delivery_attempts
FOR EACH ROW EXECUTE FUNCTION db31_block_sms_attempt_mutation();

-- Source-status mapping for future writer cutover:
--   legacy status='SENT'   -> outcome='PROVIDER_ACCEPTED',
--     provider_message_id + provider_accepted_at=now()
--   legacy status='FAILED' -> outcome='FAILED',
--     safe failure code/summary; never provider response body containing secrets.
--
-- Known source purposes include: otp, notification, job.update.
-- Do NOT CHECK-enumerate purpose values: source comments explicitly anticipate
-- attendance.absence / attendance.correction and future product purposes.
--
-- Exclusions:
-- * no rendered SMS body
-- * no full recipient phone
-- * no OTP value
-- * no provider credentials
-- * no delivery claim when the provider only accepted the request
-- * no queue/claim/retry semantics: those belong to outbound command models
-- * no numbered migration, Drizzle export or runtime producer in this stage


-- Proposed privileged support read. This is still STAGING, not an installed
-- API, migration, send recorder or a permission grant. Strictly exact suffix
-- + purpose predicates are applied BEFORE cursor pagination. No wildcard
-- phone searches, body text, OTP values or unredacted recipient are returned.
CREATE OR REPLACE FUNCTION db31_list_sms_attempts_for_support(
  p_recipient_suffix varchar DEFAULT NULL,
  p_purpose varchar DEFAULT NULL,
  p_before_created_at timestamptz DEFAULT NULL,
  p_before_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  purpose text,
  recipient_suffix text,
  provider text,
  outcome text,
  safe_failure_code text,
  safe_failure_summary text,
  created_at timestamptz,
  provider_accepted_at timestamptz
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=pg_catalog,public AS $$
  SELECT
    a.id, a.purpose::text, a.recipient_suffix::text, a.provider::text,
    a.outcome::text, a.safe_failure_code::text,
    a.safe_failure_summary::text, a.created_at, a.provider_accepted_at
  FROM public.sms_delivery_attempts a
  WHERE (p_recipient_suffix IS NULL OR a.recipient_suffix = p_recipient_suffix)
    AND (p_purpose IS NULL OR a.purpose = p_purpose)
    AND (
      p_before_created_at IS NULL
      OR a.created_at < p_before_created_at
      OR (a.created_at = p_before_created_at AND p_before_id IS NOT NULL AND a.id < p_before_id)
    )
    AND (p_recipient_suffix IS NULL OR p_recipient_suffix ~ '^[0-9]{1,4}$')
    AND (p_purpose IS NULL OR length(btrim(p_purpose)) BETWEEN 1 AND 64)
  ORDER BY a.created_at DESC, a.id DESC
  LIMIT GREATEST(1,LEAST(COALESCE(p_limit,50),100));
$$;

-- PostgreSQL grants EXECUTE ON FUNCTION to PUBLIC by default. This helper
-- must remain inaccessible until the DB owner grants table SELECT and
-- function EXECUTE only to a dedicated verified global SMS support DB role.
-- A College Admin or tenant-scoped service role MUST NOT receive that grant.
REVOKE ALL ON FUNCTION db31_list_sms_attempts_for_support(
  varchar,varchar,timestamptz,uuid,integer
) FROM PUBLIC;
REVOKE ALL ON TABLE sms_delivery_attempts FROM PUBLIC;

-- Legacy support translation (no legacy data transfer is needed for vNext):
--   sms_delivery_log.status = SENT -> PROVIDER_ACCEPTED (not DELIVERED)
--   sms_delivery_log.status = FAILED -> FAILED with sanitized code/summary
--   sms_delivery_log.college_id NULL -> organization_id and college_id NULL
--   each retry -> one additional append-only row (attempt_number increments)
--   sms_delivery_log.recipient_suffix -> exact suffix, never full phone
--
-- Deployment gates (all must be verified independently):
-- 1. Register via schema lane's numbered migration / journal, replay on dev.
-- 2. Grant INSERT to an authenticated producer and SELECT plus function
--    EXECUTE only to a global support actor; enforce role at HTTP boundary.
-- 3. Exotel recorder stores provider acceptance or sanitized failure once per
--    attempted send, including an OTP send without a college membership.
-- 4. Read API uses this function, no unscoped arbitrary tenant option.
-- 5. Confirm index scans for suffix+purpose and descending recent view, and
--    verify redaction and append-only behavior. No CI/runtime check here.
