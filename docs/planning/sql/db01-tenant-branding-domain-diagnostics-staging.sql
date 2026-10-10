-- DB-004 / Chat 2 — candidate only. DO NOT APPLY directly.
-- Chat 1 exclusively registers and replays numbered Drizzle migrations.
--
-- Evidence:
--   lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   model/CollegeBranding.java
--   controller/PublicTenantController.java
--   model/TenantDomain.java
--   service/TenantDomainVerificationService.java
--
-- No legacy user data migration is required. PostgreSQL is vNext's source of
-- record and vNext admins must create new college data via vNext workflows.
--
-- Before integration, regenerate SQL through Drizzle from the staged typed
-- proposal src/db/schema/db01-tenant-branding.staged.ts and the existing
-- src/db/schema/tenant-domains.ts. Do not simply append this to the journal.

CREATE TABLE college_branding (
    college_id uuid PRIMARY KEY
      REFERENCES colleges(id) ON DELETE RESTRICT,
    logo_url text,
    favicon_url text,
    login_background_url text,
    login_background_url_mobile text,
    primary_color varchar(64),
    secondary_color varchar(64),
    support_email varchar(320),
    support_phone varchar(64),
    terms_url text,
    privacy_url text,
    archived_at timestamptz,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT college_branding_version_ck CHECK (version >= 1)
);

-- Legacy stores last-found DNS TXT values for failed domain proof and
-- successful verification (maximum 500 characters in legacy service).
-- Values are untrusted and may be sensitive; integrate only with a strict
-- write-side redaction/normalization policy and privileged-read permission.
ALTER TABLE tenant_domains
  ADD COLUMN last_found_values varchar(500);

-- Required integrator and acceptance decisions:
-- 1. Staged TS and this SQL are not active or schema-barrel registered.
-- 2. No automatic external URL publishing. Validate https/object ownership,
--    prevent XSS/unsafe schemes and constrain links before public bootstrap.
-- 3. Rendering public bootstrap is separate from privileged super-admin writes;
--    preserve logo fallback, desktop/mobile background difference, archived
--    branding fallback and college ownership.
-- 4. Use version CAS + persisted actor/tenant authorization for edits.
-- 5. Host-change invalidates verification; a failed TXT recheck does not
--    accidentally revoke existing proof. Preserve verified-primary guards.
-- 6. College deletion/archival and branding archival must be checked together
--    so a public tenant resolver never serves archived tenants.
-- 7. Audit mutable settings without writing raw TXT values or secrets to
--    unbounded telemetry. Decide retention/redaction before activation.
-- 8. Empty-and-latest disposable PostgreSQL migration replay, negative
--    cross-tenant access tests and concurrent-write tests required for gate.
