-- Legacy SELECTED/PENDING_VERIFICATION belongs to placement_drive_selections;
-- released offers are ISSUED. Joining history remains a separate domain.
ALTER TABLE placement_offers
  ADD COLUMN row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN legacy_role_option_name text,
  ADD COLUMN legacy_ctc_lpa numeric,
  ADD COLUMN created_by_type varchar(24),
  ADD COLUMN verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN released_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_offers ADD CONSTRAINT placement_offers_row_version_ck
  CHECK (row_version > 0);
--> statement-breakpoint
ALTER TABLE placement_offers ADD CONSTRAINT placement_offers_created_by_type_ck
  CHECK (created_by_type IS NULL OR created_by_type IN ('TPO', 'RECRUITER'));
--> statement-breakpoint
-- Release was implicit for pre-existing ISSUED/answered offers; no role invented.
UPDATE placement_offers
  SET released_at = issued_at
  WHERE released_at IS NULL;
