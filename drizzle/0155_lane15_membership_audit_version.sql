-- Membership CAS is separate from device/session token revocation.
ALTER TABLE college_memberships ADD COLUMN version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE college_memberships ADD CONSTRAINT college_memberships_version_ck CHECK (version > 0);
--> statement-breakpoint
ALTER TABLE membership_roles ADD COLUMN assigned_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
