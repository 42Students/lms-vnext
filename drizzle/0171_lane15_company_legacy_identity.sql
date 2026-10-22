-- Import provenance only; no historical data is migrated automatically.
ALTER TABLE placement_companies
 ADD COLUMN IF NOT EXISTS legacy_company_id integer,
 ADD COLUMN IF NOT EXISTS legacy_created_by_role varchar(20),
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS placement_companies_legacy_company_uq
 ON placement_companies(legacy_company_id) WHERE legacy_company_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_legacy_lengths_ck
 CHECK (length(trim(name)) BETWEEN 2 AND 150
  AND (website_url IS NULL OR length(website_url)<=500)
  AND (logo_public_url IS NULL OR length(logo_public_url)<=500)
  AND (industry IS NULL OR length(industry)<=100))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status='ARCHIVED')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
