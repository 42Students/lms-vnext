-- Lane 15 DB10 outbound/suppression storage. Owner approval and disposable PostgreSQL replay REQUIRED before execution.
-- This migration stores only keyed HMAC recipient identifiers and encrypted payloads. No sender, provider role or credentials are activated.
-- No legacy data is present in this greenfield vNext deployment; any future legacy email_suppression export must be normalized and HMAC'd offline with
-- the dedicated stable DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64 and domain label global-email-suppression-v1, deduped before import, then plaintext securely discarded.
CREATE TABLE outbound_messages (
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
--> statement-breakpoint
CREATE UNIQUE INDEX db10_outbound_idempotency_uq ON outbound_messages(idempotency_key);
--> statement-breakpoint
CREATE INDEX db10_outbound_due_idx ON outbound_messages(status,next_attempt_at,not_before);
--> statement-breakpoint
CREATE INDEX db10_outbound_scope_idx ON outbound_messages(organization_id,college_id,created_at);
--> statement-breakpoint
CREATE INDEX db10_outbound_claim_expiry_idx ON outbound_messages(claim_expires_at,status);
--> statement-breakpoint
CREATE TABLE outbound_suppressions (
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
--> statement-breakpoint
CREATE UNIQUE INDEX db10_outbound_suppressions_active_uq
  ON outbound_suppressions(organization_id,channel,recipient_hash)
  WHERE cleared_at IS NULL;
--> statement-breakpoint
CREATE INDEX db10_outbound_suppressions_scope_idx
  ON outbound_suppressions(organization_id,created_at);
--> statement-breakpoint
CREATE TABLE outbound_global_email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_hash varchar(64) NOT NULL,
  reason varchar(24) NOT NULL,
  source_event_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  cleared_at timestamptz,
  CONSTRAINT db10_global_email_suppressions_hash_ck
    CHECK (recipient_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT db10_global_email_suppressions_reason_ck
    CHECK (reason IN ('UNSUBSCRIBED','BOUNCE','COMPLAINT')),
  CONSTRAINT db10_global_email_suppressions_clear_order_ck
    CHECK (cleared_at IS NULL OR cleared_at >= created_at)
);
--> statement-breakpoint
CREATE UNIQUE INDEX db10_global_email_suppressions_active_uq
  ON outbound_global_email_suppressions(recipient_hash)
  WHERE cleared_at IS NULL;
--> statement-breakpoint
CREATE INDEX db10_global_email_suppressions_created_idx
  ON outbound_global_email_suppressions(created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS colleges_id_organization_uq ON colleges (id, organization_id);
--> statement-breakpoint
-- Newly created outbound table is empty; enforce the correct college/organization pair before any enqueue.
ALTER TABLE outbound_messages ADD CONSTRAINT db10_outbound_college_organization_fk
 FOREIGN KEY (college_id, organization_id) REFERENCES colleges (id, organization_id)
 ON UPDATE RESTRICT ON DELETE RESTRICT;
