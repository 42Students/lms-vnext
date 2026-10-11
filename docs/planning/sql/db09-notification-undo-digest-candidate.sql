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
       AND claim_lease_expires_at IS NOT NULL AND claim_token IS NOT NULL)
      OR
      (status <> 'CLAIMED' AND claim_lease_expires_at IS NULL AND claim_token IS NULL)
    ),
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

-- Atomic state transitions expected from the eventual trusted service:
-- UNDO: lock undo group + all queued intent rows in same transaction,
-- assert clock < undo_deadline; update only PENDING to CANCELLED; reject a
-- request claiming *full* undo if ANY member was claimed/published already.
-- CLAIM: SELECT ... FOR UPDATE SKIP LOCKED for status=PENDING,
-- send_after<=now(), cancelled_at IS NULL; set CLAIMED and fence with token.
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
-- two-reader independent read flags, digest isolation, duplicate event,
-- retry/recipient privacy and 100-way concurrent claim/cancel must pass on
-- disposable PostgreSQL before migrator can promote this candidate.
