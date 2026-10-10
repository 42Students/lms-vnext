-- DB-004 / Chat 2 — UNREGISTERED DB01 tenant-domain diagnostics staging contract.
-- This is NOT a numbered Drizzle migration and MUST NOT be treated as runtime-active.
-- Chat 1 remains the sole numbered migration/schema-barrel integrator.
--
-- Legacy source oracle:
--   42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   TenantDomainVerificationService stores DNS TXT values in tenant_domain.last_found_values
--   and truncates the persisted diagnostic string to 500 characters.
--
-- vNext currently persists last_check_result / last_checked_at but has no equivalent
-- last_found_values column in src/db/schema/tenant-domains.ts.
--
-- Promotion requirement: Chat 1 must translate/register the final Drizzle migration,
-- replay it on clean PostgreSQL, and retain the existing host/primary/verified constraints.

alter table tenant_domains
  add column if not exists last_found_values varchar(500);

comment on column tenant_domains.last_found_values is
  'Latest bounded DNS TXT values observed during tenant-domain verification; untrusted diagnostic data, admin-scoped and never an authorization signal.';

-- Behavioral acceptance belongs to DB01/API integration tests after registration:
-- 1. successful/failed checks may persist at most 500 characters;
-- 2. a failed recheck must not silently clear an already verified domain;
-- 3. host changes must invalidate prior verification proof according to the final lifecycle contract;
-- 4. host resolution must continue to reject unverified domains by default;
-- 5. this diagnostic value must never participate in tenant authorization or public bootstrap output.
