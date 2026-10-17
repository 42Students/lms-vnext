-- PUB-auth-public-50/52/53/57; OD-09. Orchestrator must register this before
-- permitting public shares. Existing link-only shares are revoked, not silently
-- converted to six-digit challenges without a code for their issuers.
BEGIN;
ALTER TABLE placement_company_applicant_shares
 ADD COLUMN IF NOT EXISTS code_hash varchar(64),
 ADD COLUMN IF NOT EXISTS code_salt varchar(32),
 ADD COLUMN IF NOT EXISTS wrong_code_count integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS wrong_code_window_start timestamptz,
 ADD COLUMN IF NOT EXISTS locked_until timestamptz,
 ADD COLUMN IF NOT EXISTS selected_columns jsonb NOT NULL DEFAULT '["APPLICATION_ID","NAME","EMAIL"]'::jsonb,
 ADD COLUMN IF NOT EXISTS shortlist_by timestamptz;
UPDATE placement_company_applicant_shares SET revoked_at=clock_timestamp()
 WHERE revoked_at IS NULL AND (code_hash IS NULL OR code_salt IS NULL);
UPDATE placement_company_applicant_shares SET code_hash=repeat('0',64),code_salt=repeat('0',32)
 WHERE code_hash IS NULL OR code_salt IS NULL;
ALTER TABLE placement_company_applicant_shares
 ALTER COLUMN code_hash SET NOT NULL,
 ALTER COLUMN code_salt SET NOT NULL;
ALTER TABLE placement_company_applicant_shares
 ADD CONSTRAINT pcas_code_hash_ck CHECK (code_hash ~ '^[a-f0-9]{64}$' AND code_salt ~ '^[a-f0-9]{32}$'),
 ADD CONSTRAINT pcas_wrong_code_count_ck CHECK (wrong_code_count BETWEEN 0 AND 10),
 ADD CONSTRAINT pcas_selected_columns_ck CHECK (
   jsonb_typeof(selected_columns)='array' AND
   jsonb_array_length(selected_columns) BETWEEN 1 AND 11
 );
ALTER TABLE placement_company_applicant_share_views
 DROP CONSTRAINT IF EXISTS pcas_views_kind_ck;
ALTER TABLE placement_company_applicant_share_views
 ADD CONSTRAINT pcas_views_kind_ck CHECK (event_kind IN ('VIEW','CSV','LOCKED'));
COMMIT;
