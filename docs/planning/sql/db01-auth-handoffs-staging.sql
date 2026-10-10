-- DB-004 / Chat 2 — security-safe cross-host login handoff candidate.
-- STAGED ONLY, not applied or registered. Chat 1 alone owns numbered Drizzle
-- migrations and src/db/schema/index.ts. Source oracle:
-- lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5 AuthController.java.
--
-- The legacy handoff table persisted raw access/refresh tokens: intentionally
-- rejected for vNext. A high-entropy bearer handoff code is returned once;
-- PostgreSQL stores only its keyed MAC and nonsecret metadata.

CREATE TABLE identity_auth_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_membership_id uuid NOT NULL
    REFERENCES college_memberships(id) ON DELETE RESTRICT,
  target_domain_id uuid NOT NULL
    REFERENCES tenant_domains(id) ON DELETE RESTRICT,
  target_host varchar(253) NOT NULL,
  code_mac varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CONSTRAINT identity_auth_handoffs_lifetime_ck
    CHECK (expires_at > created_at AND
      expires_at <= created_at + interval '2 minutes'),
  CONSTRAINT identity_auth_handoffs_consumed_ck
    CHECK (consumed_at IS NULL OR
      (consumed_at >= created_at AND consumed_at < expires_at)),
  CONSTRAINT identity_auth_handoffs_mac_format_ck
    CHECK (code_mac ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX identity_auth_handoffs_code_mac_uq
  ON identity_auth_handoffs (code_mac);
CREATE INDEX identity_auth_handoffs_user_expiry_idx
  ON identity_auth_handoffs (user_id, expires_at);
CREATE INDEX identity_auth_handoffs_domain_expiry_idx
  ON identity_auth_handoffs (target_domain_id, expires_at);

-- Intended atomic consume (API phase ONLY; executable transaction reviewed
-- and tested after Drizzle migration, NOT currently implemented):
--
-- UPDATE identity_auth_handoffs
--    SET consumed_at = NOW()
--  WHERE code_mac = $1
--    AND target_domain_id = $2
--    AND target_host = $3
--    AND consumed_at IS NULL
--    AND expires_at > NOW()
-- RETURNING user_id, target_membership_id, target_domain_id, target_host;
--
-- The service must lock/reload the ACTIVE user, ACTIVE matching membership,
-- target verified and non-archived domain, ACTIVE college and organization
-- BEFORE issuing target-origin Firebase bootstrap; the UPDATE and current
-- scope checks must commit consistently (one transaction or fail closed).
-- The target domain's college must equal membership.college, and membership
-- owner must equal handoff.user. Joining those distinct FKs does not prove
-- they match: add database composite FKs if feasible, else execute negative
-- integration tests for forged references and concurrent revocations.
--
-- Never store Firebase ID/access/refresh tokens, cookies or raw one-time code.
-- Keep the raw code out of URL query/referrer/logs and enforce short TTL,
-- origin/host binding, HTTPS and strict non-cacheable response.
-- Purge expired/consumed code MAC rows using bounded retention.
