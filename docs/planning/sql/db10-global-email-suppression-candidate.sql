-- DB-050 / Chat 3 · 2026-10-11
-- CANDIDATE ONLY. DO NOT RUN ALONGSIDE AUTO-GENERATED DRIZZLE DDL.
-- Integrator Chat 1 owns registered migration order, journal and replay.
-- Canonical source: src/db/schema/db10-outbound-messages.draft.ts.
-- Legacy source: EmailSuppressionEntity.java, email_suppression(email_norm PK).
--
-- Outbound recipient_hash is organization-scoped and MUST NOT be reused for
-- global suppression. The producer must HMAC the normalized email using
-- DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64, not the rotating encryption secret.
-- The HMAC must be domain-separated: global-email-suppression-v1.
-- This table never contains raw email, token, phone, address or merge fields.
-- Replays are only permitted in an isolated database whose registered
-- migrations already supplied the corresponding canonical table shape.
-- IF NOT EXISTS prevents duplicate relation failures; it never drops data,
-- constraints, tenant checks or historical suppression evidence.

CREATE TABLE IF NOT EXISTS outbound_global_email_suppressions (
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
CREATE UNIQUE INDEX IF NOT EXISTS db10_global_email_suppressions_active_uq
  ON outbound_global_email_suppressions(recipient_hash)
  WHERE cleared_at IS NULL;
CREATE INDEX IF NOT EXISTS db10_global_email_suppressions_created_idx
  ON outbound_global_email_suppressions(created_at);

-- Consumer MUST check both existing tenant local active suppression and
-- this table in the same INSERT SELECT anti-join.
--
-- select NOT EXISTS (
--   select 1 from outbound_suppressions s
--   where s.organization_id = :org
--     and s.channel = :channel
--     and s.recipient_hash = :tenant_hash
--     and s.cleared_at is null
-- ) AND NOT EXISTS (
--   select 1 from outbound_global_email_suppressions g
--   where :channel = 'EMAIL'
--     and g.recipient_hash = :global_email_hash
--     and g.cleared_at is null
-- );
--
-- Acceptance on disposable PG, no real emails:
-- [ ] same global HMAC prevents email inserts in org A and org B.
-- [ ] distinct recipient still enqueues; SMS/WHATSAPP not globally blocked.
-- [ ] org-local ADMIN_BLOCK blocks only its org; global opt-out blocks all.
-- [ ] concurrent globally suppressed duplicate event never reports QUEUED.
-- [ ] clearing requires privileged audited authorization; another tenant
--     cannot clear someone else's GLOBAL opt-out.
-- [ ] direct SQL cannot overwrite/forge suppression without trusted role.
-- [ ] dispatcher rechecks BOTH scopes immediately before provider handoff;
--     a concurrent unsubscribe after enqueue prevents sending.
-- [ ] key rotation only rotates outbox encryption key; the dedicated global
--     HMAC key remains stable. If it must rotate, preserve old key-version
--     lookups and re-key opt-outs with a safe migration before activation.
--
-- CI GitHub Actions is intentionally disabled for billing; standalone Node
-- assertions and disposable Postgres tests can run independent of Actions.
-- This file is an implementation/witness contract, NOT SQL proof.
