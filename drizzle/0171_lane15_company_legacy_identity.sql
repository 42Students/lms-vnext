-- Import provenance only; no historical data is migrated automatically.
ALTER TABLE placement_companies
 ADD COLUMN IF NOT EXISTS legacy_company_id integer,
 ADD COLUMN IF NOT EXISTS legacy_created_by_role varchar(20),
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean;
CREATE UNIQUE INDEX IF NOT EXISTS placement_companies_legacy_company_uq
 ON placement_companies(legacy_company_id) WHERE legacy_company_id IS NOT NULL;
ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_legacy_lengths_ck
 CHECK (length(trim(name)) BETWEEN 2 AND 150
  AND (website_url IS NULL OR length(website_url)<=500)
  AND (logo_public_url IS NULL OR length(logo_public_url)<=500)
  AND (industry IS NULL OR length(industry)<=100));
ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status='ARCHIVED');
