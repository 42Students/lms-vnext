ALTER TABLE "identity_auth_attempts" ADD COLUMN "ip_tag" varchar(24);--> statement-breakpoint
CREATE INDEX "identity_auth_attempts_contact_ip_idx" ON "identity_auth_attempts" USING btree ("contact_fingerprint","ip_tag","created_at");--> statement-breakpoint
CREATE INDEX "identity_auth_attempts_ip_rate_idx" ON "identity_auth_attempts" USING btree ("ip_tag","created_at");