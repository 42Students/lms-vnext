-- [chat-14] Wave2 scoped legacy UI/data parity additions.
ALTER TABLE placement_round_attendance
 ADD COLUMN IF NOT EXISTS marked_by_role_snapshot varchar(32),
 ADD COLUMN IF NOT EXISTS legacy_reset_to_waiting boolean;
--> statement-breakpoint
ALTER TABLE placement_drive_change_requests
 ADD COLUMN IF NOT EXISTS canonical_thread_id uuid,
 ADD COLUMN IF NOT EXISTS legacy_was_replied boolean;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_drive_changes_thread_idx
 ON placement_drive_change_requests (canonical_thread_id);
--> statement-breakpoint
ALTER TABLE placement_public_page_settings
 ADD COLUMN IF NOT EXISTS legacy_publication_id integer,
 ADD COLUMN IF NOT EXISTS legacy_publication_payload jsonb,
 ADD COLUMN IF NOT EXISTS updated_by_user_id uuid REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE placement_public_page_settings
 ADD CONSTRAINT placement_public_legacy_payload_ck
 CHECK (legacy_publication_payload IS NULL OR jsonb_typeof(legacy_publication_payload)='object');
--> statement-breakpoint
-- Issuers must revoke/disable the previous link in the same transaction before
-- replacing one college/company's link; never include clock-based expressions in
-- an index predicate.
CREATE UNIQUE INDEX IF NOT EXISTS public_join_one_active_college_uq
 ON placement_public_join_links(college_id)
 WHERE scope='COLLEGE' AND revoked_at IS NULL AND enabled = true;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS public_join_one_active_company_uq
 ON placement_public_join_links(college_id,company_id)
 WHERE scope='COMPANY' AND revoked_at IS NULL AND enabled = true;
