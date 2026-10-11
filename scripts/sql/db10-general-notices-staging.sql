-- DB-024: general TPO notification outbox — STAGING ONLY, NOT REGISTERED.
-- Legacy oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   V161__tpo_v1_drives.sql + NotificationOutboxService.java.
-- Separate from DB10 outbound_messages recruiter invitation transport.
-- Only Chat 1 may register this in drizzle/meta and src/db/schema/index.ts.
-- Nothing here enables a production sender or constitutes PostgreSQL proof.

CREATE TABLE general_notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  source_event_id uuid NOT NULL,
  event varchar(50) NOT NULL,
  recipient_type varchar(16) NOT NULL,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient_membership_id uuid REFERENCES college_memberships(id) ON DELETE RESTRICT,
  channel varchar(10) NOT NULL,
  safe_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  send_after timestamptz NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  undo_group_id uuid,
  hold_for_undo boolean NOT NULL DEFAULT false,
  digest_local_date date,
  digest_timezone varchar(40),
  claimed_by varchar(120),
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  claim_fence integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  failure_code varchar(60),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key varchar(64) NOT NULL,
  CONSTRAINT db10_general_notices_event_ck CHECK (length(btrim(event)) > 0),
  CONSTRAINT db10_general_notices_channel_ck CHECK (channel IN ('APP','EMAIL','SMS')),
  CONSTRAINT db10_general_notices_recipient_ck
    CHECK (recipient_type IN ('LEARNER','FACULTY','RECRUITER')),
  CONSTRAINT db10_general_notices_membership_shape_ck CHECK (
    (recipient_type IN ('LEARNER','FACULTY') AND recipient_membership_id IS NOT NULL)
    OR (recipient_type = 'RECRUITER' AND recipient_membership_id IS NULL)
  ),
  CONSTRAINT db10_general_notices_status_ck
    CHECK (status IN ('PENDING','CLAIMED','HANDED_OFF','SENT','CANCELLED','FAILED')),
  CONSTRAINT db10_general_notices_handoff_ck
    CHECK (status <> 'HANDED_OFF' OR channel IN ('EMAIL','SMS')),
  CONSTRAINT db10_general_notices_undo_ck CHECK (
    NOT hold_for_undo OR
    (undo_group_id IS NOT NULL AND send_after >= created_at + interval '30 seconds')
  ),
  CONSTRAINT db10_general_notices_digest_ck CHECK (
    (digest_local_date IS NULL AND digest_timezone IS NULL)
    OR (channel = 'EMAIL' AND digest_local_date IS NOT NULL
        AND digest_timezone = 'Asia/Kolkata')
  ),
  CONSTRAINT db10_general_notices_claim_ck CHECK (
    (status = 'CLAIMED' AND claimed_by IS NOT NULL
      AND claimed_at IS NOT NULL AND claim_expires_at IS NOT NULL)
    OR (status <> 'CLAIMED' AND claimed_by IS NULL
      AND claimed_at IS NULL AND claim_expires_at IS NULL)
  ),
  CONSTRAINT db10_general_notices_claim_time_ck
    CHECK (claim_expires_at IS NULL OR claim_expires_at > claimed_at),
  CONSTRAINT db10_general_notices_fence_ck CHECK (claim_fence >= 0),
  CONSTRAINT db10_general_notices_sent_ck CHECK (
    (status = 'SENT' AND sent_at IS NOT NULL)
    OR (status <> 'SENT' AND sent_at IS NULL)
  ),
  CONSTRAINT db10_general_notices_idempotency_ck
    CHECK (idempotency_key ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX db10_general_notices_idempotency_uq
  ON general_notification_outbox (idempotency_key);
CREATE INDEX db10_general_notices_due_idx
  ON general_notification_outbox (status,send_after);
CREATE INDEX db10_general_notices_undo_idx
  ON general_notification_outbox (college_id,undo_group_id,status);
CREATE INDEX db10_general_notices_recipient_idx
  ON general_notification_outbox (recipient_user_id,channel,status,send_after);
CREATE INDEX db10_general_notices_digest_idx
  ON general_notification_outbox (college_id,digest_local_date,recipient_user_id);

-- Fail closed for college recipient roles even under direct SQL writes.
-- Do not silently trust a UUID membership FK or mutable recipient user input.
CREATE FUNCTION db10_general_notice_scope_guard() RETURNS trigger
LANGUAGE plpgsql AS $db10notice$
BEGIN
  PERFORM 1 FROM colleges c
    WHERE c.id = NEW.college_id AND c.organization_id = NEW.organization_id
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOTIFICATION_COLLEGE_SCOPE_INVALID' USING ERRCODE='23514';
  END IF;
  IF NEW.recipient_type IN ('LEARNER','FACULTY') THEN
    PERFORM 1 FROM college_memberships m
      WHERE m.id = NEW.recipient_membership_id
        AND m.user_id = NEW.recipient_user_id
        AND m.college_id = NEW.college_id AND m.status = 'ACTIVE'
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'NOTIFICATION_MEMBERSHIP_SCOPE_INVALID' USING ERRCODE='23514';
    END IF;
  ELSE
    -- Recruiter identity/grant semantics are not a college membership.
    -- Deny until the migration integrator couples this guard to DB09
    -- recruiter profile + active same-college grant through a separate
    -- exact producer/tenant contract. This prevents cross-college leakage.
    RAISE EXCEPTION 'NOTIFICATION_RECRUITER_GRANT_GUARD_NOT_REGISTERED'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$db10notice$;
CREATE TRIGGER db10_general_notice_scope_trg
BEFORE INSERT OR UPDATE OF organization_id,college_id,recipient_type,
  recipient_user_id,recipient_membership_id
ON general_notification_outbox
FOR EACH ROW EXECUTE FUNCTION db10_general_notice_scope_guard();

-- Claim/Undo/Delivery implementation contract (source-only):
-- 1. App inserts become visible ONLY after undo deadline and transactionally
--    insert in_app_notifications, with stable event idempotency. Never render
--    a PENDING/CLAIMED row directly as the user-visible notice.
-- 2. Cancel undo_group_id must UPDATE only PENDING rows scoped by college
--    AND execute before claim. A claimed or already handed-off item cannot be
--    truthfully undone; client must receive explicit cannot-cancel outcome.
-- 3. Claim with SELECT ... FOR UPDATE SKIP LOCKED; use fencing and DB clock;
--    do not perform external send while holding a long database transaction.
-- 4. EMAIL digest dispatch groups by college, recipient, local date in
--    Asia/Kolkata at 08:00; one sender receipt covers all grouped rows, with
--    failure/retry safety. Do not send one email per row.
-- 5. External EMAIL/SMS are handed to the *encrypted* outbound_messages
--    queue; status HANDED_OFF is NOT SENT/DELIVERED. No token/PII in safe_payload_json.
-- 6. Legacy event/toggle/SMS cap rules remain consumer work; this stage
--    does not prove templates/providers or delivery and is NOT production-ready.
