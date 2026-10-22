-- SUSPENDED blocks current recruiter access while retaining an auditable
-- reason and clear reactivation path distinct from archival.
ALTER TABLE placement_recruiter_profiles
 ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
 ADD COLUMN IF NOT EXISTS suspension_reason varchar(500),
 ADD COLUMN IF NOT EXISTS legacy_recruiter_id integer;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_recruiter_profiles_legacy_id_uq
 ON placement_recruiter_profiles(legacy_recruiter_id) WHERE legacy_recruiter_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_recruiter_profiles DROP CONSTRAINT IF EXISTS placement_recruiter_profiles_status_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_recruiter_profiles ADD CONSTRAINT placement_recruiter_profiles_status_ck
 CHECK (status IN ('ACTIVE','SUSPENDED','ARCHIVED'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_recruiter_profiles ADD CONSTRAINT placement_recruiter_profiles_suspension_ck
 CHECK ((status='SUSPENDED')=(suspended_at IS NOT NULL)
  AND (suspension_reason IS NULL OR length(suspension_reason)<=500))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
