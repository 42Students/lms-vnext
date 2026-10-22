-- DB-024 / DB-050 / DB-067 transactional outbox: ISOLATED ACCEPTANCE DDL ONLY.
-- Mirrors src/db/schema/db10-outbound-messages.draft.ts for a disposable
-- PostgreSQL test fixture. This file is NOT a numbered Drizzle migration,
-- is NOT approved for production, and MUST NEVER enable a real sender.
-- Apply after registered baseline, followed by the independent global-email
-- suppression proposal and DB067 composite parent-FK candidate.
-- No plaintext addresses, invitation tokens or template variables are stored.
-- Replays are only permitted in an isolated database whose registered
-- migrations already supplied the corresponding canonical table shape.
-- IF NOT EXISTS prevents duplicate relation failures; it never drops data,
-- constraints, tenant checks or historical suppression evidence.
CREATE TABLE IF NOT EXISTS outbound_messages (
  id uuid PRIMARY KEY NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  source_event_id uuid NOT NULL,
  channel varchar(16) NOT NULL,
  template_key varchar(64) NOT NULL,
  recipient_hash varchar(64) NOT NULL,
  global_email_hash_commitment varchar(64),
  idempotency_key varchar(64) NOT NULL,
  request_digest varchar(64) NOT NULL,
  key_id varchar(24) NOT NULL,
  nonce_base64 varchar(24) NOT NULL,
  tag_base64 varchar(32) NOT NULL,
  ciphertext_base64 text NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'PENDING',
  not_before timestamptz,
  expires_at timestamptz,
  next_attempt_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  claimed_by varchar(120),
  claim_expires_at timestamptz,
  claim_fence integer NOT NULL DEFAULT 0,
  pre_send_authorized_fence integer,
  provider_message_id varchar(200),
  provider_accepted_at timestamptz,
  delivered_at timestamptz,
  last_safe_failure_code varchar(40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db10_outbound_channel_ck CHECK (channel IN ('EMAIL','SMS','WHATSAPP')),
  CONSTRAINT db10_outbound_template_ck CHECK (
    template_key IN ('RECRUITER_INVITATION','RECRUITER_INVITATION_REMINDER')
  ),
  CONSTRAINT db10_outbound_status_ck CHECK (
    status IN ('PENDING','CLAIMED','RETRY','PROVIDER_ACCEPTED','DELIVERED','SUPPRESSED','BOUNCED','FAILED','EXPIRED')
  ),
  CONSTRAINT db10_outbound_request_digest_ck CHECK (request_digest ~ '^[0-9a-f]{64}$'),
  CONSTRAINT db10_outbound_idempotency_hash_ck CHECK (idempotency_key ~ '^[0-9a-f]{64}$'),
  CONSTRAINT db10_outbound_recipient_hash_ck CHECK (recipient_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT db10_outbound_email_commitment_ck CHECK (
    (channel = 'EMAIL' AND global_email_hash_commitment IS NOT NULL
      AND global_email_hash_commitment ~ '^[0-9a-f]{64}$')
    OR (channel <> 'EMAIL' AND global_email_hash_commitment IS NULL)
  ),
  CONSTRAINT db10_outbound_pre_send_fence_ck CHECK (
    pre_send_authorized_fence IS NULL
    OR (status = 'CLAIMED' AND pre_send_authorized_fence = claim_fence)
  ),
  CONSTRAINT db10_outbound_attempts_ck CHECK (attempts >= 0 AND attempts <= 5),
  CONSTRAINT db10_outbound_fence_ck CHECK (claim_fence >= 0),
  CONSTRAINT db10_outbound_expiry_ck CHECK (
    expires_at IS NULL OR not_before IS NULL OR expires_at > not_before
  ),
  CONSTRAINT db10_outbound_claim_shape_ck CHECK (
    (status = 'CLAIMED' AND claimed_by IS NOT NULL AND claim_expires_at IS NOT NULL)
    OR (status <> 'CLAIMED' AND claimed_by IS NULL AND claim_expires_at IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS db10_outbound_idempotency_uq ON outbound_messages(idempotency_key);
CREATE INDEX IF NOT EXISTS db10_outbound_due_idx ON outbound_messages(status,next_attempt_at,not_before);
CREATE INDEX IF NOT EXISTS db10_outbound_scope_idx ON outbound_messages(organization_id,college_id,created_at);
CREATE INDEX IF NOT EXISTS db10_outbound_claim_expiry_idx ON outbound_messages(claim_expires_at,status);

CREATE TABLE IF NOT EXISTS outbound_suppressions (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  channel varchar(16) NOT NULL,
  recipient_hash varchar(64) NOT NULL,
  reason varchar(24) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cleared_at timestamptz,
  CONSTRAINT db10_outbound_suppressions_channel_ck CHECK (
    channel IN ('EMAIL','SMS','WHATSAPP')
  ),
  CONSTRAINT db10_outbound_suppressions_reason_ck CHECK (
    reason IN ('UNSUBSCRIBED','BOUNCE','COMPLAINT','ADMIN_BLOCK')
  ),
  CONSTRAINT db10_outbound_suppressions_hash_ck CHECK (recipient_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT db10_outbound_suppressions_clear_order_ck CHECK (
    cleared_at IS NULL OR cleared_at >= created_at
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS db10_outbound_suppressions_active_uq
  ON outbound_suppressions(organization_id,channel,recipient_hash)
  WHERE cleared_at IS NULL;
CREATE INDEX IF NOT EXISTS db10_outbound_suppressions_scope_idx
  ON outbound_suppressions(organization_id,created_at);

-- Deliberately NOT part of registered Drizzle journal.
-- Do not enable DB10_OUTBOUND_READY outside isolated test execution.
