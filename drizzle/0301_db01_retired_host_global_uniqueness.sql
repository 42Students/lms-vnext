-- DB-004: A retired hostname is never implicitly released for another
-- college. All application and custom/managed subdomain claims must honor
-- the same invariant as direct SQL. The existing partial index in 0159
-- protected only live hosts; this index also reserves soft-deleted hosts.
DROP INDEX IF EXISTS "tenant_domains_host_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_domains_host_uq"
  ON "tenant_domains" (lower("host"));
