-- [chat-14] Scoped source identity. No legacy organization rows are migrated.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS legacy_organization_id integer;
--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS organizations_legacy_id_uq
  ON organizations(legacy_organization_id) WHERE legacy_organization_id IS NOT NULL;
