-- Membership CAS is separate from device/session token revocation.
ALTER TABLE college_memberships ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE college_memberships ADD CONSTRAINT college_memberships_version_ck CHECK (version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE membership_roles ADD COLUMN IF NOT EXISTS assigned_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
