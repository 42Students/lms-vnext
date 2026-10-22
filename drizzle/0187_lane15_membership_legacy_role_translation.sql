-- One source person can own many college memberships, but none acquires
-- extra role authority from the numeric source role identifier.
ALTER TABLE college_memberships
 ADD COLUMN IF NOT EXISTS legacy_membership_id integer,
 ADD COLUMN IF NOT EXISTS legacy_removed_at timestamptz;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS college_memberships_legacy_college_id_uq
 ON college_memberships(college_id,legacy_membership_id)
 WHERE legacy_membership_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE college_memberships ADD CONSTRAINT college_memberships_legacy_removed_ck
 CHECK (legacy_removed_at IS NULL OR status<>'ACTIVE')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE membership_roles ADD COLUMN IF NOT EXISTS legacy_role_id integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS membership_roles_source_lookup_idx
 ON membership_roles(legacy_role_id,membership_id) WHERE legacy_role_id IS NOT NULL;
