-- DB-004 / Chat 2, staging only. DO NOT APPLY directly.
-- The following MUST be generated/registered in a coordinated Drizzle
-- migration by Chat 1 after the identity_auth_attempts and
-- identity_auth_handoffs tables are approved. This file is a canonical
-- dependency/order reference, not an executable production migration.
--
-- Existing parent tables have PK(id), but PostgreSQL requires a matching
-- unique key on the *whole referenced column set* for a composite FK.
-- These parent uniqueness constraints are redundant functionally but are
-- needed for the canonical cross-tenant matching FKs.

ALTER TABLE college_memberships
  ADD CONSTRAINT college_memberships_id_user_college_uq
  UNIQUE (id, user_id, college_id);

ALTER TABLE tenant_domains
  ADD CONSTRAINT tenant_domains_id_college_uq
  UNIQUE (id, college_id);

-- If a login attempt has membership_id, it must also have college_id.
-- Without this check a nullable composite FK can short-circuit and skip
-- validating a forged or mismatched membership.
ALTER TABLE identity_auth_attempts
  ADD CONSTRAINT identity_auth_attempts_membership_scope_fk
  FOREIGN KEY (membership_id, user_id, college_id)
  REFERENCES college_memberships (id, user_id, college_id)
  ON DELETE RESTRICT;

-- Cross-host handoff is always intended for a particular active college,
-- so all references must be NOT NULL and match the very same owner/college.
-- Its draft SQL already declares college_id NOT NULL.
ALTER TABLE identity_auth_handoffs
  ADD CONSTRAINT identity_auth_handoffs_membership_scope_fk
  FOREIGN KEY (target_membership_id, user_id, college_id)
  REFERENCES college_memberships (id, user_id, college_id)
  ON DELETE RESTRICT;

ALTER TABLE identity_auth_handoffs
  ADD CONSTRAINT identity_auth_handoffs_domain_scope_fk
  FOREIGN KEY (target_domain_id, college_id)
  REFERENCES tenant_domains (id, college_id)
  ON DELETE RESTRICT;

-- These FKs close membership-owned-by-user and membership/domain-college
-- mismatch. They DO NOT prove an object is active, verified, unexpired,
-- or tied to the current hostname: validate those state transitions under
-- a transaction at issue and consume time; do not bypass on provider error.
--
-- Mandatory executed negative tests AFTER integration:
-- 1. Insert attempt with membership/user mismatch -> FK 23503.
-- 2. Insert attempt with membership/college mismatch -> FK 23503.
-- 3. Insert attempt with membership set and college NULL -> CHECK 23514.
-- 4. Insert handoff with user/member mismatch -> FK 23503.
-- 5. Insert handoff with tenant-domain/member college mismatch -> FK 23503.
-- 6. Change host/verification/revoke membership between issue and consume
--    -> no new Identity Platform session cookie minted.
-- 7. Verify exact Drizzle snapshot/SQL replay with all parent unique keys.
