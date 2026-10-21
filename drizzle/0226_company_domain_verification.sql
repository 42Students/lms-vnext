-- [chat-14] Domain-level verification is not inherited from parent company.
ALTER TABLE placement_company_domains ADD COLUMN verified_by_42 boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN verified_at timestamptz;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN added_by_college_id uuid REFERENCES colleges(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN added_by_user_type varchar(32);
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN legacy_domain_id integer;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN legacy_company_id integer;
--> statement-breakpoint
ALTER TABLE placement_company_domains ADD COLUMN legacy_added_by_college_id integer;
--> statement-breakpoint
CREATE INDEX placement_company_domains_verification_idx ON placement_company_domains(company_id,verified_by_42);
