-- [chat-14] Historical domain actor provenance; verified-by-42 is a domain fact.
ALTER TABLE placement_company_domains ADD COLUMN IF NOT EXISTS legacy_added_by_user_id integer;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN IF NOT EXISTS legacy_added_by_user_name varchar(160);
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN IF NOT EXISTS legacy_source_time_zone varchar(60);
--> statement-breakpoint
ALTER TABLE placement_company_domains ALTER COLUMN added_by_user_id DROP NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_company_domains_company_order_idx ON placement_company_domains (company_id,domain,id);
--> statement-breakpoint
ALTER TABLE placement_company_domains DROP CONSTRAINT IF EXISTS placement_company_domains_name_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_company_domains ADD CONSTRAINT placement_company_domains_name_ck CHECK (length(trim(domain)) BETWEEN 1 AND 253)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
