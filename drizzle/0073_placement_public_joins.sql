CREATE TABLE "placement_public_join_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"work_email" varchar(254) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_public_join_challenges_code_ck" CHECK ("placement_public_join_challenges"."code_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "placement_public_join_challenges_attempts_ck" CHECK ("placement_public_join_challenges"."attempts" BETWEEN 0 AND 5)
);
--> statement-breakpoint
CREATE TABLE "placement_public_join_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"college_id" uuid NOT NULL,
	"company_id" uuid,
	"company_domain" varchar(254),
	"scope" varchar(12) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_public_join_links_token_ck" CHECK ("placement_public_join_links"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "placement_public_join_links_scope_ck" CHECK ("placement_public_join_links"."scope" IN ('COLLEGE','COMPANY')),
	CONSTRAINT "public_join_company_shape" CHECK (("placement_public_join_links"."scope"='COLLEGE' AND "placement_public_join_links"."company_id" IS NULL AND "placement_public_join_links"."company_domain" IS NULL) OR ("placement_public_join_links"."scope"='COMPANY' AND "placement_public_join_links"."company_id" IS NOT NULL AND "placement_public_join_links"."company_domain" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "placement_public_join_challenges" ADD CONSTRAINT "placement_public_join_challenges_link_id_placement_public_join_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."placement_public_join_links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_public_join_links" ADD CONSTRAINT "placement_public_join_links_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_join_challenges_link_email_idx" ON "placement_public_join_challenges" USING btree ("link_id","work_email","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "public_join_links_hash_uq" ON "placement_public_join_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "public_join_links_college_idx" ON "placement_public_join_links" USING btree ("college_id","scope");