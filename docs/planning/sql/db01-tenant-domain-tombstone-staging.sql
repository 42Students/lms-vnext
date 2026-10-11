-- Chat 2 / DB-004 — proposal only, NOT a registered Drizzle migration.
-- LEGACY SOURCE: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   model/TenantDomain.java inherits BaseModel.is_deleted;
--   repository/TenantDomainRepository.java excludes deleted rows;
--   service/TenantDomainVerificationService.java refuses deleted rows.
-- CURRENT VNEXT: src/modules/tenant-domains/repository.ts hard-deletes rows.
--
-- Chat 1 owns numbered migrations, active Drizzle schema and index changes.
-- No legacy production data is being migrated into this greenfield DB.
--
-- Design choice: preserve a tombstone for audit/lifecycle parity while
-- retaining the EXISTING all-time lower(host) uniqueness until the user
-- explicitly decides whether deleted hostnames may ever be reused.
-- Do NOT deploy independently of repository/resolver/permission changes.

ALTER TABLE tenant_domains
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE tenant_domains
  ADD COLUMN deleted_by_user_id uuid
    REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE tenant_domains
  ADD COLUMN deletion_reason text;

-- A tombstoned domain must not remain primary, even if historically verified.
-- Retain historical verification state but never allow host routing from it.
ALTER TABLE tenant_domains
  ADD CONSTRAINT tenant_domains_deleted_nonprimary_ck
  CHECK (deleted_at IS NULL OR is_primary = false);

-- Deletion metadata must never be attached to an active host.
ALTER TABLE tenant_domains
  ADD CONSTRAINT tenant_domains_deletion_metadata_ck
  CHECK (
    deleted_at IS NOT NULL
    OR (deleted_by_user_id IS NULL AND deletion_reason IS NULL)
  );

CREATE INDEX tenant_domains_active_college_idx
  ON tenant_domains (college_id, is_primary, is_verified)
  WHERE deleted_at IS NULL;

-- PROMOTION REQUIREMENTS (NOT EXECUTED):
-- 1. Atomically clear is_primary and set deleted_at in the same transaction.
-- 2. Every host lookup, admin active-list, verification/recheck, and primary
--    promotion must exclude deleted_at IS NOT NULL records.
-- 3. The host-routing path must also require verified domain + ACTIVE college
--    and organization, including during concurrent tombstone/recheck races.
-- 4. Reject stale verifier writes after deletion using guarded UPDATE and/or
--    row locking. Do not let a recheck resurrect a tombstone.
-- 5. Keep the existing global tenant_domains_host_uq unique index unchanged:
--    host reuse after deletion is a separate unapproved product/security choice.
-- 6. Execute clean PostgreSQL migration replay, negative uniqueness/tenant
--    tests, concurrent delete-vs-verify/primary, and active-host denial.
-- 7. Privileged actor ID and deletion reason retention/PII policy must be
--    agreed before finalizing the generated Drizzle migration.
