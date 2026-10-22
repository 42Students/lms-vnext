-- [chat-14] Archive provenance retained across name reuse; current tenant UUIDs stay immutable.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS legacy_source_name text;
--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS archived_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS organizations_legacy_source_name_idx
 ON organizations(lower(legacy_source_name))
 WHERE legacy_source_name IS NOT NULL AND legacy_organization_id IS NOT NULL;
