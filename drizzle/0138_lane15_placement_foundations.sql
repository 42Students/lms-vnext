-- Lane 15 placement foundations. Owner approval required before execution.
-- NULL counts_as_placed is unresolved until per-college type policy backfill.
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_version_ck CHECK (version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DROP INDEX IF EXISTS placement_companies_name_uq;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_companies_name_idx ON placement_companies (lower(name));
--> statement-breakpoint
ALTER TABLE placement_company_relationships
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS contact_person_name varchar(150),
  ADD COLUMN IF NOT EXISTS contact_email varchar(150),
  ADD COLUMN IF NOT EXISTS contact_phone varchar(30);
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants
  ADD COLUMN IF NOT EXISTS granted_by_type varchar(32),
  ADD COLUMN IF NOT EXISTS revoked_by_type varchar(32),
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT placement_recruiter_grants_version_ck CHECK (version > 0)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE placement_jobs ADD COLUMN IF NOT EXISTS counts_as_placed boolean;
--> statement-breakpoint
ALTER TABLE placement_candidate_academic_evidence
  ADD COLUMN IF NOT EXISTS source_metadata jsonb,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;
