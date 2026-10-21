-- Tombstone and DNS diagnostics. Service still must redact TXT secrets and stop
-- hard-delete writes; schemas alone cannot enforce URL-resolution policy.
ALTER TABLE tenant_domains
  ADD COLUMN last_found_values varchar(512),
  ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
DROP INDEX IF EXISTS tenant_domains_host_uq;
--> statement-breakpoint
CREATE UNIQUE INDEX tenant_domains_host_uq ON tenant_domains(lower(host)) WHERE deleted_at IS NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS tenant_domains_college_primary_uq;
--> statement-breakpoint
CREATE UNIQUE INDEX tenant_domains_college_primary_uq
  ON tenant_domains(college_id) WHERE is_primary = true AND deleted_at IS NULL;
