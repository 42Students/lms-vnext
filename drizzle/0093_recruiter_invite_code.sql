-- Old recruiter invite IDs require verified same-college lead UUID mapping.
-- Import only credential digests, never plaintext token or code. Map old
-- wrongTries to bounded failed_attempts; usedAt to consumed_at. Convert
-- source civil timestamps before setting expires_at. Historic expired/used
-- invitations stay inactive, and unknown provider state is never SENT.
CREATE TABLE "recruiter_invite_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"delivery_state" varchar(16) DEFAULT 'PENDING' NOT NULL,
	CONSTRAINT "recruiter_invite_code_token_hash_ck" CHECK ("recruiter_invite_code"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "recruiter_invite_code_code_hash_ck" CHECK ("recruiter_invite_code"."code_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "recruiter_invite_code_expiry_ck" CHECK ("recruiter_invite_code"."expires_at" > "recruiter_invite_code"."sent_at" and "recruiter_invite_code"."expires_at" <= "recruiter_invite_code"."sent_at" + interval '10 minutes'),
	CONSTRAINT "recruiter_invite_code_attempts_ck" CHECK ("recruiter_invite_code"."failed_attempts" between 0 and 5),
	CONSTRAINT "recruiter_invite_code_delivery_state_ck" CHECK ("recruiter_invite_code"."delivery_state" in ('PENDING', 'SENT', 'FAILED')),
	CONSTRAINT "recruiter_invite_code_time_ck" CHECK ("recruiter_invite_code"."consumed_at" is null or "recruiter_invite_code"."consumed_at" >= "recruiter_invite_code"."sent_at")
);
--> statement-breakpoint
ALTER TABLE "recruiter_invite_code" ADD CONSTRAINT "recruiter_invite_code_lead_id_placement_tpo_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."placement_tpo_leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_invite_code" ADD CONSTRAINT "recruiter_invite_code_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_invite_code" ADD CONSTRAINT "recruiter_invite_code_scoped_fk" FOREIGN KEY ("college_id","lead_id") REFERENCES "public"."placement_tpo_leads"("college_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recruiter_invite_code_lead_sent_idx" ON "recruiter_invite_code" USING btree ("lead_id","sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "recruiter_invite_code_college_sent_idx" ON "recruiter_invite_code" USING btree ("college_id","sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "recruiter_invite_code_token_active_idx" ON "recruiter_invite_code" USING btree ("token_hash","sent_at" DESC NULLS LAST);