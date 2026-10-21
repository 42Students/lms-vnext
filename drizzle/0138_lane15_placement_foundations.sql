-- Lane 15 placement foundations. Owner approval required before execution.
-- NULL counts_as_placed is unresolved until per-college type policy backfill.
ALTER TABLE placement_companies ADD COLUMN version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_version_ck CHECK (version > 0);
--> statement-breakpoint
DROP INDEX IF EXISTS placement_companies_name_uq;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_companies_name_idx ON placement_companies (lower(name));
--> statement-breakpoint
ALTER TABLE placement_company_relationships
  ADD COLUMN internal_notes text,
  ADD COLUMN contact_person_name varchar(150),
  ADD COLUMN contact_email varchar(150),
  ADD COLUMN contact_phone varchar(30);
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants
  ADD COLUMN granted_by_type varchar(32),
  ADD COLUMN revoked_by_type varchar(32),
  ADD COLUMN version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT placement_recruiter_grants_version_ck CHECK (version > 0);
--> statement-breakpoint
ALTER TABLE placement_jobs ADD COLUMN counts_as_placed boolean;
--> statement-breakpoint
ALTER TABLE placement_candidate_academic_evidence
  ADD COLUMN source_metadata jsonb,
  ADD COLUMN imported_at timestamptz;
