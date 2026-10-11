-- DB-012/CHAT-03: notification_outbox gap, DATABASE source reconciliation.
-- CANDIDATE ONLY, NOT REGISTERED, NOT EXECUTED, NOT A PROVIDER ADAPTER.
-- Legacy oracle lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5:
--   NotificationOutboxEntry, NotificationOutboxService, NotificationOutboxRepository.
-- Current vNext has activity_events + in_app_notifications and a DB10 draft
--   outbound_messages, but no generalized placement event/undo/digest bridge.
--
-- Composite parent keys for colleges(id,organization_id) and
-- activity_events(id,organization_id,college_id) are centralized in
-- db09-parent-composite-keys-candidate.sql. This file owns only notification
-- child state; W01 must deduplicate the shared parent keys before registration.

-- A cancellable source event may fan out to many users and channels. The
-- deadline is persisted once so an undo never becomes a best-effort
-- reversal after a provider or APP publication has already started.
CREATE TABLE placement_notification_undo_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL,
  undo_deadline timestamptz NOT NULL,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db09_notify_undo_owner_fk
    FOREIGN KEY (college_id, organization_id)
    REFERENCES colleges(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT db09_notify_undo_scope_uq
    UNIQUE (id, organization_id, college_id),
  CONSTRAINT db09_notify_undo_deadline_ck
    CHECK (undo_deadline >= created_at + interval '30 seconds'),
  CONSTRAINT db09_notify_undo_cancel_time_ck
    CHECK (cancelled_at IS NULL OR
      (cancelled_at >= created_at AND cancelled_at <= undo_deadline))
);

-- This is metadata for delivery intent and APP fanout, NOT a storage table
-- for recipient email/phone or plaintext merge variables. The generic
-- external-delivery envelope contract remains with DB10; until it supports
-- all TPO events, EMAIL/SMS records must not be dispatched via this draft.
CREATE TABLE placement_notification_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL,
  source_event_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient_kind varchar(16) NOT NULL,
  event_key varchar(96) NOT NULL,
  channel varchar(8) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'PENDING',
  send_after timestamptz NOT NULL DEFAULT now(),
  undo_group_id uuid,
  digest_day date,
  -- External content must be encrypted in the DB10 envelope before the
  -- generalized sender is enabled. There is deliberately no payload_json.
  encrypted_outbound_ref_id uuid
    REFERENCES outbound_messages(id) ON DELETE RESTRICT,
  claimed_at timestamptz,
  claim_lease_expires_at timestamptz,
  claim_token uuid,
  sent_at timestamptz,
  failure_code varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db09_notify_college_owner_fk
    FOREIGN KEY (college_id, organization_id)
    REFERENCES colleges(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT db09_notify_source_event_scope_fk
    FOREIGN KEY (source_event_id, organization_id, college_id)
    REFERENCES activity_events(id, organization_id, college_id) ON DELETE RESTRICT,
  CONSTRAINT db09_notify_undo_group_scope_fk
    FOREIGN KEY (undo_group_id, organization_id, college_id)
    REFERENCES placement_notification_undo_groups(id, organization_id, college_id)
    ON DELETE RESTRICT,
  CONSTRAINT db09_notify_delivery_dedup_uq
    UNIQUE (source_event_id, recipient_user_id, channel),
  CONSTRAINT db09_notify_recipient_kind_ck
    CHECK (recipient_kind IN ('LEARNER','RECRUITER','FACULTY')),
  CONSTRAINT db09_notify_channel_ck
    CHECK (channel IN ('APP','EMAIL','SMS')),
  CONSTRAINT db09_notify_status_ck
    CHECK (status IN (
      'PENDING','CLAIMED','CANCELLED','FAILED',
      'APP_PUBLISHED','PROVIDER_ACCEPTED','DELIVERED'
    )),
  CONSTRAINT db09_notify_event_nonempty_ck
    CHECK (length(trim(event_key)) > 0),
  CONSTRAINT db09_notify_digest_channel_ck
    CHECK (digest_day IS NULL OR channel = 'EMAIL'),
  -- Digest's local calendar day is a *business* timezone decision.
  -- Do not cast timestamptz to date in a DB CHECK: it depends on session TZ.
  CONSTRAINT db09_notify_digest_future_ck
    CHECK (digest_day IS NULL OR send_after >= created_at),
  CONSTRAINT db09_notify_claim_state_ck
    CHECK (
      (status = 'CLAIMED' AND claimed_at IS NOT NULL
       AND claim_lease_expires_at IS NOT NULL
       AND claim_lease_expires_at > claimed_at
       AND claim_token IS NOT NULL)
      OR
      (status <> 'CLAIMED' AND claim_lease_expires_at IS NULL AND claim_token IS NULL)
    ),
  CONSTRAINT db09_notify_channel_terminal_ck
    CHECK (
      (channel = 'APP' AND status NOT IN ('PROVIDER_ACCEPTED','DELIVERED'))
      OR
      (channel IN ('EMAIL','SMS') AND status <> 'APP_PUBLISHED')
    ),
  CONSTRAINT db09_notify_failure_shape_ck
    CHECK (status <> 'FAILED' OR failure_code IS NOT NULL),
  CONSTRAINT db09_notify_external_ref_ck
    CHECK (channel = 'APP' OR encrypted_outbound_ref_id IS NOT NULL),
  CONSTRAINT db09_notify_app_ref_ck
    CHECK (channel <> 'APP' OR encrypted_outbound_ref_id IS NULL),
  CONSTRAINT db09_notify_sent_time_ck
    CHECK (
      (status IN ('APP_PUBLISHED','PROVIDER_ACCEPTED','DELIVERED')
       AND sent_at IS NOT NULL)
      OR
      (status NOT IN ('APP_PUBLISHED','PROVIDER_ACCEPTED','DELIVERED')
       AND sent_at IS NULL)
    )
);
CREATE INDEX db09_notification_due_idx
  ON placement_notification_intents(send_after, created_at)
  WHERE status = 'PENDING';
CREATE INDEX db09_notification_undo_idx
  ON placement_notification_intents(undo_group_id, status)
  WHERE undo_group_id IS NOT NULL;
CREATE INDEX db09_notification_recipient_idx
  ON placement_notification_intents(college_id, recipient_user_id, created_at);
CREATE INDEX db09_notification_digest_idx
  ON placement_notification_intents(college_id, recipient_user_id, digest_day)
  WHERE status = 'PENDING' AND digest_day IS NOT NULL;

-- Recipient identity is tenant-bearing state. A canonical user UUID alone is
-- not enough to make a learner/faculty/recruiter recipient valid for a college.
CREATE FUNCTION db09_assert_notification_recipient_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.recipient_kind = 'LEARNER' THEN
    IF NOT EXISTS (
      SELECT 1
        FROM college_memberships m
        JOIN membership_roles r ON r.membership_id = m.id
       WHERE m.user_id = NEW.recipient_user_id
         AND m.college_id = NEW.college_id
         AND m.status = 'ACTIVE'
         AND r.role = 'LEARNER'
    ) THEN
      RAISE EXCEPTION 'notification learner recipient is not active in college'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.recipient_kind = 'FACULTY' THEN
    IF NOT EXISTS (
      SELECT 1
        FROM college_memberships m
        JOIN membership_roles r ON r.membership_id = m.id
       WHERE m.user_id = NEW.recipient_user_id
         AND m.college_id = NEW.college_id
         AND m.status = 'ACTIVE'
         AND r.role IN ('FACULTY','COLLEGE_ADMIN','MENTOR','TPO')
    ) THEN
      RAISE EXCEPTION 'notification faculty recipient is not active in college'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.recipient_kind = 'RECRUITER' THEN
    IF NOT db09_has_active_recruiter_grant(
      NEW.recipient_user_id,
      NEW.college_id,
      NULL
    ) THEN
      RAISE EXCEPTION 'notification recruiter recipient lacks active college grant'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_notification_recipient_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,recipient_user_id,recipient_kind
  ON placement_notification_intents
  FOR EACH ROW EXECUTE FUNCTION db09_assert_notification_recipient_scope();

CREATE FUNCTION db09_assert_notification_undo_timing() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_deadline timestamptz;
  v_cancelled timestamptz;
BEGIN
  IF NEW.undo_group_id IS NOT NULL THEN
    SELECT undo_deadline,cancelled_at
      INTO v_deadline,v_cancelled
      FROM placement_notification_undo_groups
     WHERE id = NEW.undo_group_id
       AND organization_id = NEW.organization_id
       AND college_id = NEW.college_id;

    IF v_deadline IS NULL THEN
      RAISE EXCEPTION 'notification undo group does not match intent scope'
        USING ERRCODE = '23503';
    END IF;
    IF NEW.send_after < v_deadline THEN
      RAISE EXCEPTION 'undoable notification cannot become due before undo deadline'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.status IN ('CLAIMED','APP_PUBLISHED','PROVIDER_ACCEPTED','DELIVERED')
       AND (v_cancelled IS NOT NULL OR clock_timestamp() < v_deadline) THEN
      RAISE EXCEPTION 'cancelled or still-undoable notification cannot be claimed/published'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.status = 'CLAIMED'
     AND NEW.send_after > clock_timestamp() THEN
    RAISE EXCEPTION 'notification cannot be claimed before send_after'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER db09_notification_undo_timing_guard
  BEFORE INSERT OR UPDATE OF
    organization_id,college_id,undo_group_id,status,send_after
  ON placement_notification_intents
  FOR EACH ROW EXECUTE FUNCTION db09_assert_notification_undo_timing();

-- Atomic full-undo operation. It fails closed if any member has already moved
-- beyond PENDING; callers cannot truthfully report a partial undo as success.
CREATE FUNCTION db09_cancel_notification_undo_group(p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_group placement_notification_undo_groups%ROWTYPE;
  v_non_pending integer;
  v_cancelled integer;
BEGIN
  SELECT *
    INTO v_group
    FROM placement_notification_undo_groups
   WHERE id = p_group_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'notification undo group not found'
      USING ERRCODE = '23503';
  END IF;
  IF v_group.cancelled_at IS NOT NULL THEN
    RETURN 0;
  END IF;
  IF clock_timestamp() > v_group.undo_deadline THEN
    RAISE EXCEPTION 'notification undo deadline passed'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1
    FROM placement_notification_intents
   WHERE undo_group_id = p_group_id
   FOR UPDATE;

  SELECT count(*)
    INTO v_non_pending
    FROM placement_notification_intents
   WHERE undo_group_id = p_group_id
     AND status <> 'PENDING';

  IF v_non_pending > 0 THEN
    RAISE EXCEPTION 'notification undo group already started delivery'
      USING ERRCODE = '23514';
  END IF;

  UPDATE placement_notification_undo_groups
     SET cancelled_at = clock_timestamp()
   WHERE id = p_group_id;

  UPDATE placement_notification_intents
     SET status = 'CANCELLED'
   WHERE undo_group_id = p_group_id
     AND status = 'PENDING';
  GET DIAGNOSTICS v_cancelled = ROW_COUNT;
  RETURN v_cancelled;
END $$;

-- Canonical claim path for workers. Row locks + SKIP LOCKED serialize workers,
-- while the timing trigger and group predicate make cancellation win before
-- the deadline and prevent a cancelled group from being claimed later.
CREATE FUNCTION db09_claim_notification_intents(
  p_limit integer,
  p_claim_token uuid,
  p_lease_seconds integer
) RETURNS SETOF placement_notification_intents
LANGUAGE plpgsql AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 1000 THEN
    RAISE EXCEPTION 'invalid notification claim batch size'
      USING ERRCODE = '22023';
  END IF;
  IF p_lease_seconds < 1 OR p_lease_seconds > 900 THEN
    RAISE EXCEPTION 'invalid notification claim lease'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT i.id
      FROM placement_notification_intents i
     WHERE i.status = 'PENDING'
       AND i.send_after <= clock_timestamp()
       AND (
         i.undo_group_id IS NULL
         OR EXISTS (
           SELECT 1
             FROM placement_notification_undo_groups g
            WHERE g.id = i.undo_group_id
              AND g.organization_id = i.organization_id
              AND g.college_id = i.college_id
              AND g.cancelled_at IS NULL
              AND g.undo_deadline <= clock_timestamp()
         )
       )
     ORDER BY i.send_after,i.created_at,i.id
     FOR UPDATE SKIP LOCKED
     LIMIT p_limit
  )
  UPDATE placement_notification_intents i
     SET status = 'CLAIMED',
         claimed_at = clock_timestamp(),
         claim_lease_expires_at =
           clock_timestamp() + make_interval(secs => p_lease_seconds),
         claim_token = p_claim_token
    FROM due
   WHERE i.id = due.id
  RETURNING i.*;
END $$;

-- Atomic state transitions expected from the eventual trusted service:
-- UNDO: db09_cancel_notification_undo_group locks group + member rows,
-- rejects deadline expiry or any member beyond PENDING, then cancels all.
-- CLAIM: db09_claim_notification_intents uses FOR UPDATE SKIP LOCKED,
-- send_after<=clock, cancelled/deadline checks and a bounded lease token.
-- SEND: update only when claim_token still matches and group not cancelled;
-- APP: insert one recipient-scoped in_app_notifications row idempotently
-- using (user_id,event_id), then mark APP_PUBLISHED in the same transaction.
-- EMAIL/SMS: encrypted_outbound_ref_id is a real FK to DB10 outbound_messages;
-- create/seal that child before external intent dispatch. Provider accepted
-- must NOT be represented as actual delivery; suppressions rechecked at send.
-- DIGEST: group only by organization + college + recipient + digest_day
-- (not just a recipient id); preserve individual delivery audit.
-- 30-second undo rule is mandatory for cancellable actions; cascading offer
-- release/accept/cancel/close are immediate *non-undo* preview/confirm flows.
--
-- ACCEPTANCE NOT EXECUTED: negative tests for cross-college event FK, wrong
-- undo-group tenant, stale lease token, already-claimed undo, APP visibility,
-- recipient-kind/college forgery, wrong channel terminal status, invalid
-- claim lease, two-reader independent read flags, digest isolation, duplicate
-- event, retry privacy and 100-way concurrent claim/cancel must pass on
-- disposable PostgreSQL before migrator can promote this candidate.
