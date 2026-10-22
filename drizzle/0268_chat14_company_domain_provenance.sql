-- [chat-14] Historical domain actor provenance; verified-by-42 is a domain fact.
ALTER TABLE placement_company_domains ADD COLUMN IF NOT EXISTS legacy_added_by_user_id integer;
ALTER TABLE placement_company_domains ADD COLUMN IF NOT EXISTS legacy_added_by_user_name varchar(160);
ALTER TABLE placement_company_domains ADD COLUMN IF NOT EXISTS legacy_source_time_zone varchar(60);
ALTER TABLE placement_company_domains ALTER COLUMN added_by_user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS placement_company_domains_company_order_idx ON placement_company_domains (company_id,domain,id);
ALTER TABLE placement_company_domains DROP CONSTRAINT IF EXISTS placement_company_domains_name_ck;
ALTER TABLE placement_company_domains ADD CONSTRAINT placement_company_domains_name_ck CHECK (length(trim(domain)) BETWEEN 1 AND 253);
