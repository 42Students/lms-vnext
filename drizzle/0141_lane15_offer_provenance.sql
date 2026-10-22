-- Legacy SELECTED/PENDING_VERIFICATION belongs to placement_drive_selections;
-- released offers are ISSUED. Joining history remains a separate domain.
ALTER TABLE placement_offers
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS legacy_role_option_name text,
  ADD COLUMN IF NOT EXISTS legacy_ctc_lpa numeric,
  ADD COLUMN IF NOT EXISTS created_by_type varchar(24),
  ADD COLUMN IF NOT EXISTS verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS released_at timestamptz;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_offers ADD CONSTRAINT placement_offers_row_version_ck
  CHECK (row_version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_offers ADD CONSTRAINT placement_offers_created_by_type_ck
  CHECK (created_by_type IS NULL OR created_by_type IN ('TPO', 'RECRUITER'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
-- Release was implicit for pre-existing ISSUED/answered offers; no role invented.
UPDATE placement_offers
  SET released_at = issued_at
  WHERE released_at IS NULL;
